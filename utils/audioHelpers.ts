import { SongMetadata } from '../types';
import { Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const extractColorFromImage = (imgSrc: string): Promise<{ r: number; g: number; b: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgSrc;
        img.onload = () => {
            const cvs = document.createElement('canvas');
            cvs.width = img.naturalWidth;
            cvs.height = img.naturalHeight;
            const ctx = cvs.getContext('2d');
            if (!ctx) {
                resolve({ r: 255, g: 255, b: 255 });
                return;
            }
            ctx.drawImage(img, 0, 0);
            try {
                // Sample from the center
                const data = ctx.getImageData(cvs.width / 4, cvs.height / 4, cvs.width / 2, cvs.height / 2).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 40) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                resolve({
                    r: Math.floor(r / count),
                    g: Math.floor(g / count),
                    b: Math.floor(b / count)
                });
            } catch (e) {
                resolve({ r: 255, g: 255, b: 255 });
            }
        };
        img.onerror = () => resolve({ r: 255, g: 255, b: 255 });
    });
};

export const getAudioFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const files: File[] = [];

    const traverse = async (entry: any) => {
        if (entry.isFile) {
            try {
                const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
                if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)) {
                    files.push(file);
                }
            } catch (e) {
                console.warn("File read error", e);
            }
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const readBatch = () => new Promise<any[]>((resolve, reject) => reader.readEntries(resolve, reject));
            try {
                let entries = await readBatch();
                while (entries.length > 0) {
                    await Promise.all(entries.map(traverse));
                    entries = await readBatch();
                }
            } catch (e) {
                console.warn("Dir read error", e);
            }
        }
    };

    if (dataTransfer.items && dataTransfer.items.length > 0) {
        const promises = [];
        for (let i = 0; i < dataTransfer.items.length; i++) {
            const item = dataTransfer.items[i];
            if (item.kind === 'file') {
                const entry = (item as any).webkitGetAsEntry?.();
                if (entry) {
                    promises.push(traverse(entry));
                }
            }
        }
        await Promise.all(promises);
    }

    // Fallback: if we didn't find anything via items (or items API not supported), try standard files list
    if (files.length === 0 && dataTransfer.files.length > 0) {
        Array.from(dataTransfer.files).forEach(file => {
            if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)) {
                files.push(file);
            }
        });
    }

    return files;
};

export const parseMetadata = async (target: File | string): Promise<SongMetadata> => {
    const isPath = typeof target === 'string';
    const name = isPath ? target.split('/').pop() || 'Unknown' : target.name;
    const defaultMeta: SongMetadata = {
        title: name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        coverUrl: null,
        color: null,
    };

    try {
        let buffer: ArrayBuffer;
        if (isPath) {
            const result = await Filesystem.readFile({
                path: target
            });
            const base64 = result.data as string;
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            buffer = bytes.buffer;
        } else {
            buffer = await target.slice(0, 512 * 1024).arrayBuffer();
        }

        const view = new DataView(buffer);

        if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
            return defaultMeta;
        }

        const version = view.getUint8(3);
        let offset = 10;
        let id3Size = ((view.getUint8(6) & 0x7f) << 21) | ((view.getUint8(7) & 0x7f) << 14) | ((view.getUint8(8) & 0x7f) << 7) | (view.getUint8(9) & 0x7f);
        const searchLimit = Math.min(buffer.byteLength, id3Size + 10);

        let foundTitle = false;
        let foundArtist = false;
        let foundCover = false;

        while (offset < searchLimit) {
            if (foundTitle && foundArtist && foundCover) break;

            let frameId = "";
            let frameSize = 0;

            if (version === 3 || version === 4) {
                frameId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
                if (version === 4) {
                    frameSize = ((view.getUint8(offset + 4) & 0x7f) << 21) | ((view.getUint8(offset + 5) & 0x7f) << 14) | ((view.getUint8(offset + 6) & 0x7f) << 7) | (view.getUint8(offset + 7) & 0x7f);
                } else {
                    frameSize = view.getUint32(offset + 4);
                }
                offset += 10;
            } else if (version === 2) {
                frameId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2));
                frameSize = (view.getUint8(offset + 3) << 16) | (view.getUint8(offset + 4) << 8) | view.getUint8(offset + 5);
                offset += 6;
            } else {
                break;
            }

            if (frameSize === 0) break;

            if (frameId === "TIT2" || frameId === "TT2" || frameId === "TPE1" || frameId === "TP1") {
                const encoding = view.getUint8(offset);
                let decoder;
                if (encoding === 0) decoder = new TextDecoder('iso-8859-1');
                else if (encoding === 1) decoder = new TextDecoder('utf-16');
                else if (encoding === 2) decoder = new TextDecoder('utf-16be');
                else if (encoding === 3) decoder = new TextDecoder('utf-8');

                if (decoder) {
                    const textBytes = new Uint8Array(buffer, offset + 1, frameSize - 1);
                    let text = decoder.decode(textBytes);
                    text = text.replace(/\0+$/, '').replace(/\0/g, ', ').trim();
                    if (frameId.startsWith("TIT") || frameId.startsWith("TT")) {
                        defaultMeta.title = text;
                        foundTitle = true;
                    } else {
                        defaultMeta.artist = text;
                        foundArtist = true;
                    }
                }
            }

            if (!foundCover && (frameId === "APIC" || frameId === "PIC")) {
                let cursor = offset + 1;
                if (version === 2) cursor += 4;
                else {
                    while (view.getUint8(cursor) !== 0 && cursor < searchLimit) cursor++;
                    cursor += 2; // Skip null + 1 byte for picture type
                }

                let dataStart = cursor;
                let foundImage = false;
                let mime = "image/jpeg";

                // Simple sniff for JPEG/PNG headers close to cursor
                for (let i = 0; i < 200; i++) {
                    if (view.getUint8(dataStart + i) === 0xFF && view.getUint8(dataStart + i + 1) === 0xD8) {
                        dataStart += i;
                        foundImage = true;
                        break;
                    }
                    if (view.getUint8(dataStart + i) === 0x89 && view.getUint8(dataStart + i + 1) === 0x50) {
                        dataStart += i;
                        foundImage = true;
                        mime = "image/png";
                        break;
                    }
                }

                if (foundImage) {
                    const imgSize = frameSize - (dataStart - offset);
                    if (imgSize > 0) {
                        const imgData = new Uint8Array(buffer, dataStart, imgSize);
                        const blob = new Blob([imgData], { type: mime });
                        defaultMeta.coverUrl = URL.createObjectURL(blob);
                        foundCover = true;
                        // Color extraction happens after loading the image
                        defaultMeta.color = await extractColorFromImage(defaultMeta.coverUrl);
                    }
                }
            }

            offset += frameSize;
        }

        return defaultMeta;

    } catch (e) {
        console.error("Error parsing ID3", e);
        return defaultMeta;
    }
};