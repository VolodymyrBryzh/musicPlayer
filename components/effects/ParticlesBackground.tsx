import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../../types';

interface ParticlesBackgroundProps {
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({ theme, extractedColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const particlesRef = useRef<{x: number, y: number, size: number, speed: number, alpha: number}[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Init particles if empty
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < 60; i++) {
                particlesRef.current.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.4 + 0.1,
                    alpha: Math.random() * 0.5 + 0.2
                });
            }
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const isMono = theme === ThemeMode.MONO || theme === ThemeMode.BLACK_WHITE;
            const r = (isMono || !extractedColor) ? 120 : extractedColor.r;
            const g = (isMono || !extractedColor) ? 120 : extractedColor.g;
            const b = (isMono || !extractedColor) ? 120 : extractedColor.b;

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
            
            particlesRef.current.forEach(p => {
                p.y -= p.speed;
                // Reset if off screen
                if (p.y < 0) {
                    p.y = canvas.height;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [theme, extractedColor]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full z-[1] pointer-events-none"
        />
    );
};

export default ParticlesBackground;