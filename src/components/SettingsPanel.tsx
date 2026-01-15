import React from 'react';
import { X } from 'lucide-react';
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

                <div className="flex-1 overflow-y-auto overflow-x-hidden md:text-right custom-scrollbar">
                    {/* Color Theme Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mb-4 md:mb-2">Color Theme</div>
                    
                    <button 
                        onClick={() => onSetTheme(ThemeMode.MONO)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.MONO ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Monochrome
                        {currentTheme === ThemeMode.MONO && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.BLACK_WHITE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.BLACK_WHITE ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Black & White
                        {currentTheme === ThemeMode.BLACK_WHITE && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.ACCENT)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ACCENT ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Cover Accent
                        {currentTheme === ThemeMode.ACCENT && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    <button 
                        onClick={() => onSetTheme(ThemeMode.ADAPTIVE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ADAPTIVE ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Adaptive
                        {currentTheme === ThemeMode.ADAPTIVE && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    {/* Dynamic Background Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mt-6 mb-4 md:mb-2">Effects</div>
                    
                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.NONE)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isStatic ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Static (Reset)
                        {isStatic && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.AURORA)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isAurora ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Aurora
                        {isAurora && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    <button 
                        onClick={() => onToggleBgMode(BackgroundMode.PARTICLES)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isParticles ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        Particles
                        {isParticles && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                    </button>

                    {/* Custom Background Images Section */}
                    <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mt-6 mb-4 md:mb-2">Background Image</div>
                    
                    <button 
                        onClick={() => onSetBackground(null)}
                        className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentBackground === null ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                    >
                        None
                        {currentBackground === null && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
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
                            className={`relative block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] overflow-hidden text-ellipsis whitespace-nowrap ${currentBackground === bg.path ? 'text-[var(--primary)] font-bold' : 'text-[var(--subtext)]'}`}
                            title={bg.name}
                        >
                            {bg.name}
                            {currentBackground === bg.path && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;
