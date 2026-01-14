import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../types';

interface VisualizerProps {
    analyser: AnalyserNode | null;
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, theme, extractedColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

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
            if (!analyser) {
                 animationRef.current = requestAnimationFrame(render);
                 return;
            }

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height / 2;
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            const r = (theme === ThemeMode.MONO || !extractedColor) ? 255 : extractedColor.r;
            const g = (theme === ThemeMode.MONO || !extractedColor) ? 255 : extractedColor.g;
            const b = (theme === ThemeMode.MONO || !extractedColor) ? 255 : extractedColor.b;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 1.5;
                const alpha = (dataArray[i] / 255) * 0.2; // Low opacity for subtle background

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(canvas.width / 2 + x, centerY - barHeight / 2, barWidth - 1, barHeight);
                ctx.fillRect(canvas.width / 2 - x, centerY - barHeight / 2, barWidth - 1, barHeight);

                x += barWidth;
            }

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyser, theme, extractedColor]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        />
    );
};

export default Visualizer;