import React, { useMemo } from 'react';
import { ThemeMode } from '../../types';

interface FloatingCirclesProps {
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const FloatingCircles: React.FC<FloatingCirclesProps> = ({ theme, extractedColor }) => {
    const circles = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            size: Math.random() * 300 + 100,
            left: Math.random() * 100,
            top: Math.random() * 100,
            duration: Math.random() * 20 + 20,
            delay: Math.random() * -20,
        }));
    }, []);

    const getColor = () => {
        if (theme === ThemeMode.ADAPTIVE && extractedColor) {
            return `rgba(${extractedColor.r}, ${extractedColor.g}, ${extractedColor.b}, 0.15)`;
        }
        if (theme === ThemeMode.ACCENT) {
            return 'rgba(var(--accent-rgb), 0.15)';
        }
        if (theme === ThemeMode.MONO) {
            return 'rgba(255, 255, 255, 0.05)';
        }
        return 'rgba(128, 128, 128, 0.1)';
    };

    const color = getColor();

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: -1,
            pointerEvents: 'none',
        }}>
            {circles.map((circle) => (
                <div
                    key={circle.id}
                    style={{
                        position: 'absolute',
                        width: circle.size,
                        height: circle.size,
                        borderRadius: '50%',
                        background: color,
                        filter: 'blur(60px)',
                        left: `${circle.left}%`,
                        top: `${circle.top}%`,
                        animation: `float ${circle.duration}s infinite linear`,
                        animationDelay: `${circle.delay}s`,
                        opacity: 0.6,
                    }}
                />
            ))}
            <style>
                {`
                    @keyframes float {
                        0% { transform: translate(0, 0) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0, 0) scale(1); }
                    }
                `}
            </style>
        </div>
    );
};

export default FloatingCircles;
