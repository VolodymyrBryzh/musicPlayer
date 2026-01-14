import React, { useRef } from 'react';

interface QueueListProps {
    playlist: File[];
    currentTrackIndex: number;
    onTrackSelect: (index: number) => void;
    onFilesSelected: (files: File[]) => void;
}

const QueueList: React.FC<QueueListProps> = ({ playlist, currentTrackIndex, onTrackSelect, onFilesSelected }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);

    // Scroll to active item when it changes
    React.useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTrackIndex]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
            onFilesSelected(files);
        }
    };

    return (
        <div className="bg-[var(--surface-side)] w-[220px] h-[420px] rounded-r-[15px] border border-[var(--border)] border-l-0 relative z-10 -ml-[15px] p-[20px] pl-[30px] flex flex-col shadow-[5px_10px_30px_rgba(0,0,0,0.4)] transition-colors duration-500">
            <div className="flex justify-between text-[10px] text-[var(--subtext)] tracking-[2px] uppercase font-bold mb-4 pb-2.5 border-b border-[var(--border)]">
                <span>Play Queue</span>
                <span className="opacity-50">{playlist.length}</span>
            </div>

            <div className="flex-grow overflow-y-auto mb-4 custom-scrollbar">
                {playlist.map((file, index) => {
                    const isActive = index === currentTrackIndex;
                    const name = file.name.replace(/\.[^/.]+$/, "");
                    return (
                        <div 
                            key={index}
                            ref={isActive ? activeItemRef : null}
                            onClick={() => onTrackSelect(index)}
                            className={`flex items-center py-2 text-[12px] cursor-pointer transition-colors duration-200 text-left border-b border-white/5 hover:text-[#888] ${isActive ? 'text-[var(--primary)] font-semibold' : 'text-[#444]'}`}
                        >
                            <span className="w-6 text-[10px] opacity-50">{index + 1}</span>
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis w-[150px]" title={name}>
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
                webkitdirectory="" 
                directory="" 
                multiple 
                onChange={handleFileChange} 
            />
            {/* Standard file fallback if directory selection isn't supported by TS types yet, though modern browsers support it */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-[10px] text-[var(--subtext)] border border-[var(--border)] py-2.5 rounded bg-transparent uppercase tracking-wider transition-all duration-200 hover:border-[#444] hover:text-[var(--primary)] hover:bg-white/5 cursor-pointer"
            >
                Select Folder
            </button>
        </div>
    );
};

export default QueueList;
