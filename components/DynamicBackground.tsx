import React from 'react';
import { BackgroundMode, ThemeMode } from '../types';
import AuroraBackground from './effects/AuroraBackground';
import ParticlesBackground from './effects/ParticlesBackground';
import FloatingCircles from './effects/FloatingCircles';

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
            {activeModes.includes(BackgroundMode.CIRCLES) && (
                <FloatingCircles theme={theme} extractedColor={extractedColor} />
            )}
        </>
    );
};

export default DynamicBackground;