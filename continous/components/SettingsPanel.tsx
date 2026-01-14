import React from 'react';
import { ThemeMode } from '../types';

interface SettingsPanelProps {
    currentTheme: ThemeMode;
    onSetTheme: (theme: ThemeMode) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentTheme, onSetTheme }) => {
    return (
        <div className="bg-[var(--surface-side)] w-[220px] h-[420px] rounded-l-[15px] border border-[var(--border)] border-r-0 relative z-10 -mr-[15px] p-[20px] pr-[30px] flex flex-col shadow-[-5px_10px_30px_rgba(0,0,0,0.4)] transition-colors duration-500">
            <div className="text-[10px] text-[var(--subtext)] tracking-[2px] uppercase font-bold mb-5 pb-2.5 border-b border-[var(--border)] text-right">
                Settings
            </div>

            <div className="mb-5 text-right">
                <div className="text-[9px] text-[var(--subtext)] uppercase tracking-[1px] mb-2">Color Theme</div>
                
                <button 
                    onClick={() => onSetTheme(ThemeMode.MONO)}
                    className={`block w-full text-right bg-transparent border-none text-[11px] py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.MONO ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                >
                    Monochrome
                    {currentTheme === ThemeMode.MONO && <span className="absolute -right-3 top-1 text-[var(--primary)]">•</span>}
                </button>

                <button 
                    onClick={() => onSetTheme(ThemeMode.ACCENT)}
                    className={`block w-full text-right bg-transparent border-none text-[11px] py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ACCENT ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                >
                    Cover Accent
                     {currentTheme === ThemeMode.ACCENT && <span className="absolute -right-3 top-1 text-[var(--primary)]">•</span>}
                </button>

                <button 
                    onClick={() => onSetTheme(ThemeMode.ADAPTIVE)}
                    className={`block w-full text-right bg-transparent border-none text-[11px] py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${currentTheme === ThemeMode.ADAPTIVE ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
                >
                    Adaptive
                     {currentTheme === ThemeMode.ADAPTIVE && <span className="absolute -right-3 top-1 text-[var(--primary)]">•</span>}
                </button>
            </div>
        </div>
    );
};

export default SettingsPanel;
