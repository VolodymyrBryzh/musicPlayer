import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Music, Settings, List } from 'lucide-react';
import { PlayerState, SongMetadata, ThemeMode } from '../types';
import { formatTime } from '../utils/audioHelpers';

interface PlayerControlsProps {
    metadata: SongMetadata;
    playerState: PlayerState;
    theme: ThemeMode;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
    onSeek: (value: number) => void;
    onOpenSettings?: () => void;
    onOpenQueue?: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
    metadata,
    playerState,
    theme,
    onTogglePlay,
    onNext,
    onPrev,
    onToggleShuffle,
    onToggleRepeat,
    onSeek,
    onOpenSettings,
    onOpenQueue
}) => {
    const { isPlaying, currentTime, duration, isShuffle, isRepeatOne } = playerState;
    
    // Calculate slider background gradient
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const sliderStyle = {
        background: `linear-gradient(to right, var(--slider-fill) 0%, var(--slider-fill) ${progress}%, var(--slider-bg) ${progress}%, var(--slider-bg) 100%)`
    };

    return (
        <div className="bg-[var(--surface-main)] p-6 md:p-10 rounded-[20px] shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-[340px] md:w-[300px] h-auto md:h-[480px] text-center relative z-20 border border-[var(--border)] flex flex-col justify-between transition-colors duration-500 mx-4 md:mx-0">
            
            {/* Mobile Navigation Header */}
            <div className="flex justify-between items-center w-full md:hidden mb-4">
                <button onClick={onOpenSettings} className="text-[var(--subtext)] hover:text-[var(--primary)] p-2 -ml-2">
                    <Settings size={20} />
                </button>
                <div className="text-[10px] text-[var(--subtext)] tracking-[2px] uppercase font-bold">
                    Now Playing
                </div>
                <button onClick={onOpenQueue} className="text-[var(--subtext)] hover:text-[var(--primary)] p-2 -mr-2">
                    <List size={20} />
                </button>
            </div>

            <div className="hidden md:block text-[11px] text-[var(--subtext)] tracking-[3px] uppercase font-bold mb-5 text-left">
                Now Playing
            </div>

            {/* Album Art Container - Added shrink-0 to prevent flex compression */}
            <div className="aspect-square w-full max-w-[220px] mx-auto shrink-0 relative rounded overflow-hidden bg-[#090909] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center border border-[var(--border)]">
                {metadata.coverUrl ? (
                    <img 
                        src={metadata.coverUrl} 
                        alt="Cover" 
                        className={`w-full h-full object-cover transition-all duration-500 ${theme === ThemeMode.MONO ? 'grayscale' : ''}`} 
                    />
                ) : (
                    <Music className="w-1/3 h-1/3 text-[#222]" />
                )}
            </div>

            <div className="mt-5 mb-2 md:mb-5">
                <div className="text-[15px] font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis text-[var(--primary)] transition-colors duration-500">
                    {metadata.title}
                </div>
                <div className="text-[12px] text-[var(--subtext)] whitespace-nowrap overflow-hidden text-ellipsis">
                    {metadata.artist}
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex justify-between items-center px-2 md:px-4 mb-4">
                    <button 
                        onClick={onToggleShuffle}
                        className={`transition-transform active:scale-95 p-2 ${isShuffle ? 'text-[var(--primary)]' : 'text-[var(--subtext)] hover:text-[var(--primary)]'}`}
                    >
                        <Shuffle size={16} />
                    </button>
                    
                    <button onClick={onPrev} className="text-[var(--subtext)] hover:text-[var(--primary)] transition-transform active:scale-95 p-2">
                        <SkipBack size={24} />
                    </button>

                    <button onClick={onTogglePlay} className="text-[var(--text)] hover:text-[var(--primary)] transition-transform active:scale-95 p-2">
                        {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
                    </button>

                    <button onClick={onNext} className="text-[var(--subtext)] hover:text-[var(--primary)] transition-transform active:scale-95 p-2">
                        <SkipForward size={24} />
                    </button>

                    <button 
                        onClick={onToggleRepeat}
                        className={`transition-transform active:scale-95 relative p-2 ${isRepeatOne ? 'text-[var(--primary)]' : 'text-[var(--subtext)] hover:text-[var(--primary)]'}`}
                    >
                        <Repeat size={16} />
                        {isRepeatOne && <span className="absolute text-[8px] font-bold top-[6px] right-[6px]">1</span>}
                    </button>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-[var(--subtext)] tabular-nums mt-2.5">
                    <span className="w-8 text-right">{formatTime(currentTime)}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="flex-grow h-[3px] rounded-sm outline-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_0_5px_rgba(0,0,0,0.5)] touch-action-none"
                        style={sliderStyle}
                    />
                    <span className="w-8 text-left">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;