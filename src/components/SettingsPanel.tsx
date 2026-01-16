import React from 'react';
import { X, Github } from 'lucide-react';
import { ThemeMode, BackgroundMode, BackgroundImage } from '../types';

interface SettingsPanelProps {
    currentTheme: ThemeMode;
    onSetTheme: (theme: ThemeMode) => void;
    backgrounds: BackgroundImage[];
    currentBackground: string | null;
    onSetBackground: (path: string | null) => void;
    activeBackgrounds: BackgroundMode[];
    onToggleBgMode: (mode: BackgroundMode) => void;
    isOpenMobile: boolean;
    onCloseMobile: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    currentTheme, 
    onSetTheme, 
    backgrounds, 
    currentBackground, 
    onSetBackground, 
    activeBackgrounds,
    onToggleBgMode,
    isOpenMobile, 
    onCloseMobile 
}) => {
    // Dynamic classes based on mobile state
    const containerClasses = isOpenMobile
        ? "fixed inset-0 z-50 m-auto w-[85%] max-w-[300px] h-[500px] max-h-[80vh] rounded-[15px] border border-[var(--border)] bg-[var(--surface-main)] shadow-2xl flex flex-col p-[30px] overflow-hidden"
        : "hidden md:flex bg-[var(--surface-side)] w-[220px] h-[420px] rounded-l-[15px] border border-[var(--border)] border-r-0 relative z-10 -mr-[15px] p-[20px] pr-[30px] flex-col shadow-[-5px_10px_30px_rgba(0,0,0,0.4)] overflow-hidden";

    const isStatic = activeBackgrounds.length === 0 || (activeBackgrounds.length === 1 && activeBackgrounds[0] === BackgroundMode.NONE);
    const isAurora = activeBackgrounds.includes(BackgroundMode.AURORA);
    const isParticles = activeBackgrounds.includes(BackgroundMode.PARTICLES);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpenMobile && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={onCloseMobile}
                />
            )}

            <div className={`${containerClasses} transition-colors duration-500`}>
                <div className="flex justify-between items-center mb-5 pb-2.5 border-b border-[var(--border)]">
                    <div className="text-[10px] text-[var(--subtext)] tracking-[2px] uppercase font-bold">
                        Settings
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onCloseMobile} className="md:hidden text-[var(--subtext)] hover:text-[var(--primary)]">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden md:text-right custom-scrollbar pr-3">
                    {/* Color Theme Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mb-4 md:mb-2">Color Theme</div>
                    
                    <button 
                        onClick={() => onSetTheme(ThemeMode.MONO)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.MONO ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Monochrome
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.BLACK_WHITE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.BLACK_WHITE ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Black & White
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.ACCENT)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ACCENT ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Cover Accent
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.ADAPTIVE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ADAPTIVE ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Adaptive
                    </button>

                    {/* Dynamic Background Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mt-6 mb-4 md:mb-2">Effects</div>
                    
                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.NONE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isStatic ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Static (Reset)
                    </button>

                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.AURORA)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isAurora ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Aurora
                    </button>

                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.PARTICLES)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isParticles ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        Particles
                    </button>

                    {/* Custom Background Images Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mt-6 mb-4 md:mb-2">Background Image</div>
                    
                    <button 
                        onClick={() => onSetBackground(null)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentBackground === null ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                    >
                        None
                    </button>

                    {backgrounds.length === 0 && (
                        <div className="text-[var(--subtext)] text-[10px] opacity-50 italic py-2">
                            Put images in /backgrounds
                        </div>
                    )}
                    {backgrounds.map((bg) => (
                        <button 
                            key={bg.path}
                            onClick={() => onSetBackground(bg.path)}
                            className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] overflow-hidden text-ellipsis whitespace-nowrap ${currentBackground === bg.path ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                            title={bg.name}
                        >
                            {bg.name}
                        </button>
                    ))}
                </div>

                <a 
                    href="https://github.com/VolodymyrBryzh/musicPlayer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full text-[10px] text-[var(--subtext)] border border-[var(--border)] py-3 md:py-2.5 rounded bg-transparent uppercase tracking-wider transition-all duration-200 hover:border-[#444] hover:text-[var(--primary)] hover:bg-white/5 cursor-pointer shrink-0 no-underline mt-auto"
                >
                    <Github size={12} />
                    <span>GitHub Repo</span>
                </a>
            </div>
        </>
    );
};

export default SettingsPanel;
