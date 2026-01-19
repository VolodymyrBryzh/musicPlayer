import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@jofr/capacitor-media-session';
import { Mediastore } from '@odion-cloud/capacitor-mediastore';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';
import { Track } from '../types';

export const isAndroid = Capacitor.getPlatform() === 'android';

export const updateMediaSession = async (metadata: { title: string; artist: string; coverUrl: string | null }) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await MediaSession.setMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: 'Monochrome Player',
            artwork: metadata.coverUrl ? [{ src: metadata.coverUrl, sizes: '512x512', type: 'image/png' }] : []
        });
    } catch (e) {
        console.error("Failed to update media session", e);
    }
};

export const initMediaSession = (handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (time: number) => void;
}) => {
    if (!Capacitor.isNativePlatform()) return;

    MediaSession.setActionHandler({ action: 'play' }, handlers.onPlay);
    MediaSession.setActionHandler({ action: 'pause' }, handlers.onPause);
    MediaSession.setActionHandler({ action: 'nexttrack' }, handlers.onNext);
    MediaSession.setActionHandler({ action: 'previoustrack' }, handlers.onPrev);
    MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
        if (details.seekTime !== undefined) handlers.onSeek(details.seekTime);
    });
};

export const scanMusicFiles = async (): Promise<Track[]> => {
    if (!isAndroid) return [];

    try {
        const permission = await Mediastore.requestPermissions();
        if (permission.audio !== 'granted') return [];

        const result = await Mediastore.getAudioFiles();
        if (!result || !result.audioFiles) return [];

        return result.audioFiles.map((item: any) => ({
            name: item.name || item.title || 'Unknown Track',
            path: item.path,
            url: item.path ? Capacitor.convertFileSrc(item.path) : undefined
        }));
    } catch (e) {
        console.error("Scan failed", e);
        return [];
    }
};

export const pickMusicDirectory = async (): Promise<Track[]> => {
    if (!isAndroid) return [];

    try {
        const result = await FilePicker.pickDirectory();
        if (!result || !result.path) return [];

        // Recursively read directory to find audio files
        const tracks: Track[] = [];

        const scanDir = async (path: string) => {
            const dir = await Filesystem.readdir({ path });
            for (const file of dir.files) {
                const subPath = `${path}/${file.name}`;
                if (file.type === 'directory') {
                    await scanDir(subPath);
                } else if (file.name.toLowerCase().endsWith('.mp3') ||
                    file.name.toLowerCase().endsWith('.wav') ||
                    file.name.toLowerCase().endsWith('.m4a')) {
                    tracks.push({
                        name: file.name,
                        path: subPath,
                        url: Capacitor.convertFileSrc(subPath)
                    });
                }
            }
        };

        await scanDir(result.path);
        return tracks;
    } catch (e) {
        console.error("Pick directory failed", e);
        return [];
    }
};
