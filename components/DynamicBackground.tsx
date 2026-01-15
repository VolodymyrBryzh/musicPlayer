import React from 'react';
import { BackgroundMode, ThemeMode } from '../types';
import AuroraBackground from './backgrounds/AuroraBackground';
import ParticlesBackground from './backgrounds/ParticlesBackground';

interface DynamicBackgroundProps {
    activeModes: BackgroundMode[];
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ activeModes, theme, extractedColor }) => {
    return (
        <>
            {activeModes.includes(BackgroundMode.AURORA) && (
                <AuroraBackground theme={theme} extractedColor={extractedColor} />
            )}
            {activeModes.includes(BackgroundMode.PARTICLES) && (
                <ParticlesBackground theme={theme} extractedColor={extractedColor} />
            )}
        </>
    );
};

export default DynamicBackground;