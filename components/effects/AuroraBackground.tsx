import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../../types';

interface AuroraBackgroundProps {
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ theme, extractedColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            timeRef.current += 0.005;
            const t = timeRef.current;
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            const isMono = theme === ThemeMode.MONO || theme === ThemeMode.BLACK_WHITE;
            const r = (isMono || !extractedColor) ? 120 : extractedColor.r;
            const g = (isMono || !extractedColor) ? 120 : extractedColor.g;
            const b = (isMono || !extractedColor) ? 120 : extractedColor.b;

            // Orb 1
            const x1 = w * 0.5 + Math.sin(t) * (w * 0.3);
            const y1 = h * 0.4 + Math.cos(t * 1.2) * (h * 0.2);
            const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, w * 0.6);
            g1.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
            g1.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();

            // Orb 2
            const x2 = w * 0.5 + Math.cos(t * 0.8) * (w * 0.3);
            const y2 = h * 0.6 + Math.sin(t * 1.1) * (h * 0.2);
            const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, w * 0.5);
            g2.addColorStop(0, `rgba(${Math.min(r+40, 255)}, ${Math.min(g+40, 255)}, ${Math.min(b+40, 255)}, 0.08)`);
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.save();
            ctx.fillStyle = g2;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();

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

export default AuroraBackground;