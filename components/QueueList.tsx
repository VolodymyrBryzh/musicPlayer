import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { getAudioFilesFromDataTransfer } from '../utils/audioHelpers';
import { isAndroid, pickMusicDirectory } from '../utils/androidBridge';
import { Track } from '../types';

interface QueueListProps {
    playlist: Track[];
    currentTrackIndex: number;
    onTrackSelect: (index: number) => void;
    onTracksAdded: (tracks: Track[]) => void;
    isOpenMobile: boolean;
    onCloseMobile: () => void;
}

const QueueList: React.FC<QueueListProps> = ({ playlist, currentTrackIndex, onTrackSelect, onTracksAdded, isOpenMobile, onCloseMobile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);

    // Scroll to active item when it changes
    React.useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTrackIndex, isOpenMobile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
            onTracksAdded(files.map(f => ({ name: f.name, file: f })));
            if (isOpenMobile) onCloseMobile();
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = await getAudioFilesFromDataTransfer(e.dataTransfer);
        if (files.length > 0) {
            onTracksAdded(files.map(f => ({ name: f.name, file: f })));
            if (isOpenMobile) onCloseMobile();
        }
    };

    const handleSelectFolder = async () => {
        if (isAndroid) {
            const tracks = await pickMusicDirectory();
            if (tracks.length > 0) onTracksAdded(tracks);
        } else {
            fileInputRef.current?.click();
        }
    };

    const containerClasses = isOpenMobile
        ? "fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 m-auto w-[calc(100%-32px)] max-w-[340px] h-fit max-h-[90dvh] rounded-[24px] border border-[var(--border)] bg-[var(--surface-main)] backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col p-6 overflow-hidden"
        : "hidden md:flex bg-[var(--surface-side)] backdrop-blur-xl w-[240px] h-[450px] rounded-r-[24px] border border-[var(--border)] border-l-0 relative z-10 -ml-[15px] p-6 pl-8 flex-col shadow-[10px_10px_40px_rgba(0,0,0,0.5)]";

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpenMobile && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={onCloseMobile}
                />
            )}

            <div
                className={`${containerClasses} transition-colors duration-500`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="flex justify-between items-center text-[10px] text-[var(--subtext)] tracking-[2px] uppercase font-bold mb-4 pb-2.5 border-b border-[var(--border)]">
                    <div className="flex gap-2">
                        <span>Play Queue</span>
                        <span className="opacity-50">{playlist.length}</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onCloseMobile} className="md:hidden text-[var(--subtext)] hover:text-[var(--primary)]">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto mb-4 custom-scrollbar">
                    {playlist.length === 0 && (
                        <div className="text-[var(--subtext)] text-[11px] text-center mt-10 opacity-50 italic">
                            Queue is empty
                        </div>
                    )}
                    {playlist.map((track, index) => {
                        const isActive = index === currentTrackIndex;
                        const name = track.name.replace(/\.[^/.]+$/, "");
                        return (
                            <div
                                key={index}
                                ref={isActive ? activeItemRef : null}
                                onClick={() => {
                                    onTrackSelect(index);
                                    if (isOpenMobile) onCloseMobile();
                                }}
                                className={`flex items-center py-2.5 md:py-2 text-[13px] md:text-[12px] cursor-pointer transition-colors duration-200 text-left border-b border-white/5 hover:text-[#888] ${isActive ? 'text-[var(--primary)] font-semibold' : 'text-[#444]'}`}
                            >
                                <span className="w-6 text-[10px] opacity-50 shrink-0">{index + 1}</span>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis w-full" title={name}>
                                    {name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    multiple
                    onChange={handleFileChange}
                />

                <button
                    onClick={handleSelectFolder}
                    className="w-full text-[10px] text-[var(--subtext)] border border-[var(--border)] py-3 md:py-2.5 rounded bg-transparent uppercase tracking-wider transition-all duration-200 hover:border-[#444] hover:text-[var(--primary)] hover:bg-white/5 cursor-pointer shrink-0"
                >
                    {isAndroid ? 'Select Music Folder' : 'Select Folder'}
                </button>
            </div>
        </>
    );
};

export default QueueList;