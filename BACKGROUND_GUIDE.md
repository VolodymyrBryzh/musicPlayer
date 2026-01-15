# How to Create Custom TSX Backgrounds

This guide explains how to create new dynamic background components for the Monochrome Player.

## 1. Component Structure

Backgrounds are React components that typically use the HTML5 Canvas API for rendering. They sit at `z-index: 1` behind the main UI.

### Props Interface

All background components must accept the following props to respond to music and theme changes:

```typescript
import { ThemeMode } from '../../types';

interface BackgroundProps {
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}
```

### Component Template

Create a new file in `components/backgrounds/NameBackground.tsx`. Use this boilerplate:

```tsx
import React, { useEffect, useRef } from 'react';
import { ThemeMode } from '../../types';

interface NameBackgroundProps {
    theme: ThemeMode;
    extractedColor: { r: number; g: number; b: number } | null;
}

const NameBackground: React.FC<NameBackgroundProps> = ({ theme, extractedColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle Resizing
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Animation Loop
        const render = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Determine colors based on theme/metadata
            const isMono = theme === ThemeMode.MONO || theme === ThemeMode.BLACK_WHITE;
            const r = (isMono || !extractedColor) ? 120 : extractedColor.r;
            const g = (isMono || !extractedColor) ? 120 : extractedColor.g;
            const b = (isMono || !extractedColor) ? 120 : extractedColor.b;

            // DRAW YOUR ANIMATION HERE using ctx
            // Example:
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            ctx.fillRect(100, 100, 100, 100);

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [theme, extractedColor]); // Re-run effect if theme or color changes

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full z-[1] pointer-events-none"
        />
    );
};

export default NameBackground;
```

## 2. Register the Background

Once your component is created, you need to register it in the application.

### Step A: Update Types
Open `types.ts` and add a new entry to the `BackgroundMode` enum.

```typescript
export enum BackgroundMode {
    NONE = 'none',
    AURORA = 'aurora',
    PARTICLES = 'particles',
    NEW_MODE = 'new_mode', // <--- Add your mode here
}
```

### Step B: Update DynamicBackground Manager
Open `components/DynamicBackground.tsx`. Import your component and add a conditional render.

```tsx
import NewBackground from './backgrounds/NewBackground';

// ... inside the component return:
{activeModes.includes(BackgroundMode.NEW_MODE) && (
    <NewBackground theme={theme} extractedColor={extractedColor} />
)}
```

### Step C: Add Toggle Button
Open `components/SettingsPanel.tsx` to allow users to toggle it.

```tsx
const isNewMode = activeBackgrounds.includes(BackgroundMode.NEW_MODE);

// ... inside the render (Background section):
<button 
    onClick={() => onToggleBgMode(BackgroundMode.NEW_MODE)}
    className={`block w-full text-left md:text-right bg-transparent border-none text-[13px] md:text-[11px] py-2 md:py-1 cursor-pointer transition-colors duration-200 hover:text-[var(--text)] ${isNewMode ? 'text-[var(--primary)] font-bold relative' : 'text-[var(--subtext)]'}`}
>
    New Mode Name
    {isNewMode && <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_4px_var(--primary)]" />}
</button>
```

## 3. Best Practices

1.  **Performance**: Always use `requestAnimationFrame`. Avoid heavy calculations in the render loop.
2.  **Responsiveness**: Ensure your logic handles `window.resize` events correctly.
3.  **Theming**: Respect the `theme` prop. If `theme` is `MONO` or `BLACK_WHITE`, default to greyscale or white values, ignoring `extractedColor`.
4.  **Opacity**: Backgrounds should be subtle. Use low opacity (e.g., `0.05` to `0.2`) so the UI remains readable.
