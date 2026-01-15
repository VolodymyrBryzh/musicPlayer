# 🎨 Шаблон Динамічного Фону для Monochrome Player

## Інструкція для AI Агента

Цей документ описує як створювати динамічні фони для Monochrome Player.

---

## 📁 Структура

```
src/
  └── components/
      └── backgrounds/
          ├── index.ts              # Реєстр всіх фонів
          ├── types.ts              # Типи для фонів
          └── [BackgroundName].tsx  # Компонент фону
```

---

## 🔧 Типи

### `src/components/backgrounds/types.ts`

```typescript
import { ThemeMode } from '../../types';

export interface DynamicBackgroundProps {
    /** Аналізатор аудіо для реакції на музику */
    analyser: AnalyserNode | null;
    /** Поточна тема */
    theme: ThemeMode;
    /** Колір з обкладинки альбому */
    extractedColor: { r: number; g: number; b: number } | null;
    /** Прозорість фону (0-1) */
    opacity?: number;
}

export interface DynamicBackgroundMeta {
    /** Унікальний ID */
    id: string;
    /** Назва для відображення */
    name: string;
    /** Опис */
    description: string;
    /** Категорія */
    category: 'animated' | 'audio-reactive' | 'interactive';
    /** Чи потребує аудіо */
    requiresAudio: boolean;
}
```

---

## 📝 Шаблон Компонента

### Базовий шаблон (без реакції на аудіо)

```typescript
// src/components/backgrounds/[Name]Background.tsx
import React, { useEffect, useRef } from 'react';
import { DynamicBackgroundProps } from './types';

const [Name]Background: React.FC<DynamicBackgroundProps> = ({ 
    theme, 
    extractedColor,
    opacity = 0.3 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Animation loop
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // ========================================
            // 👇 ТВОЯ АНІМАЦІЯ ТУТ 👇
            // ========================================
            
            const time = Date.now() * 0.001;
            
            // Приклад: малювання
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            // ... код анімації
            
            // ========================================
            // 👆 КІНЕЦЬ АНІМАЦІЇ 👆
            // ========================================

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme, extractedColor, opacity]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
            style={{ opacity }}
        />
    );
};

export default [Name]Background;

// Метадані для реєстру
export const [name]BackgroundMeta: DynamicBackgroundMeta = {
    id: '[name]',
    name: '[Display Name]',
    description: '[Опис фону]',
    category: 'animated',
    requiresAudio: false,
};
```

---

### Шаблон з реакцією на аудіо

```typescript
// src/components/backgrounds/[Name]Background.tsx
import React, { useEffect, useRef } from 'react';
import { DynamicBackgroundProps } from './types';

const [Name]Background: React.FC<DynamicBackgroundProps> = ({ 
    analyser,
    theme, 
    extractedColor,
    opacity = 0.3 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Audio data buffer
        const bufferLength = analyser?.frequencyBinCount || 128;
        const dataArray = new Uint8Array(bufferLength);

        // Animation loop
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Отримати аудіо дані
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
            }
            
            // ========================================
            // 👇 ТВОЯ АНІМАЦІЯ ТУТ 👇
            // ========================================
            
            // Доступні дані:
            // - dataArray[i] - частоти (0-255)
            // - bufferLength - кількість частот
            // - extractedColor - колір з обкладинки
            // - theme - поточна тема
            
            // Приклад: отримати середню гучність
            const avgVolume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            
            // Приклад: отримати баси (низькі частоти)
            const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
            
            // Приклад: отримати високі частоти
            const treble = dataArray.slice(-10).reduce((a, b) => a + b, 0) / 10;
            
            // Колір для малювання
            const r = extractedColor?.r ?? 255;
            const g = extractedColor?.g ?? 255;
            const b = extractedColor?.b ?? 255;
            
            // ... код анімації з використанням аудіо даних
            
            // ========================================
            // 👆 КІНЕЦЬ АНІМАЦІЇ 👆
            // ========================================

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, theme, extractedColor, opacity]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
            style={{ opacity }}
        />
    );
};

export default [Name]Background;

// Метадані для реєстру
export const [name]BackgroundMeta: DynamicBackgroundMeta = {
    id: '[name]',
    name: '[Display Name]',
    description: '[Опис фону]',
    category: 'audio-reactive',
    requiresAudio: true,
};
```

---

## 📦 Реєстр Фонів

### `src/components/backgrounds/index.ts`

```typescript
import { DynamicBackgroundMeta, DynamicBackgroundProps } from './types';
import WaveBackground, { waveBackgroundMeta } from './WaveBackground';
import ParticleBackground, { particleBackgroundMeta } from './ParticleBackground';
// ... інші імпорти

export interface RegisteredBackground {
    meta: DynamicBackgroundMeta;
    component: React.FC<DynamicBackgroundProps>;
}

export const dynamicBackgrounds: RegisteredBackground[] = [
    { meta: waveBackgroundMeta, component: WaveBackground },
    { meta: particleBackgroundMeta, component: ParticleBackground },
    // ... інші фони
];

export { default as WaveBackground } from './WaveBackground';
export { default as ParticleBackground } from './ParticleBackground';
// ... інші експорти
```

---

## 🎨 Готові Приклади Анімацій

### 1. Хвилі (Wave)

```typescript
// В render():
const time = Date.now() * 0.001;
const centerY = canvas.height / 2;
const waveCount = 3;

for (let w = 0; w < waveCount; w++) {
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let x = 0; x < canvas.width; x++) {
        const frequency = 0.01 + w * 0.005;
        const amplitude = 50 + w * 20;
        const phase = time + w * 0.5;
        const y = centerY + Math.sin(x * frequency + phase) * amplitude;
        ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 - w * 0.02})`;
    ctx.lineWidth = 2;
    ctx.stroke();
}
```

### 2. Частинки (Particles)

```typescript
// Перед render():
const particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = [];
for (let i = 0; i < 100; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1
    });
}

// В render():
particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    // Wrap around
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    ctx.fill();
});
```

### 3. Аудіо-реактивні бари

```typescript
// В render():
const barWidth = canvas.width / bufferLength;
let x = 0;

for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * canvas.height * 0.5;
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dataArray[i] / 255 * 0.3})`;
    ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
    
    x += barWidth;
}
```

### 4. Пульсуючі кола

```typescript
// В render():
const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
const scale = 1 + (bass / 255) * 0.5;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

for (let i = 5; i > 0; i--) {
    const radius = i * 50 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 / i})`;
    ctx.lineWidth = 2;
    ctx.stroke();
}
```

### 5. Градієнтний фон

```typescript
// В render():
const time = Date.now() * 0.001;
const gradient = ctx.createRadialGradient(
    canvas.width / 2 + Math.sin(time) * 100,
    canvas.height / 2 + Math.cos(time) * 100,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
);

gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

---

## ✅ Чеклист для Нового Фону

- [ ] Створити файл `[Name]Background.tsx` в `src/components/backgrounds/`
- [ ] Використати правильний шаблон (з аудіо або без)
- [ ] Замінити `[Name]` на назву фону
- [ ] Написати код анімації в позначеному місці
- [ ] Заповнити метадані (`[name]BackgroundMeta`)
- [ ] Додати в `index.ts`:
  - [ ] Імпортувати компонент
  - [ ] Додати в `dynamicBackgrounds` масив
  - [ ] Експортувати компонент
- [ ] Протестувати з різними темами
- [ ] Протестувати з музикою (якщо audio-reactive)

---

## 🎯 Важливі Правила

1. **Завжди використовуй `requestAnimationFrame`** для анімацій
2. **Завжди очищуй в `return`** cleanup функції
3. **Використовуй `opacity` prop** для регулювання прозорості
4. **Враховуй `theme`** для кольорів (mono = білий)
5. **Використовуй `extractedColor`** для динамічних кольорів
6. **Resize listener** обов'язковий для адаптивності
7. **`pointer-events-none`** щоб фон не блокував кліки

---

## 🚀 Приклад Повного Компонента

```typescript
// src/components/backgrounds/PulseBackground.tsx
import React, { useEffect, useRef } from 'react';
import { DynamicBackgroundProps, DynamicBackgroundMeta } from './types';
import { ThemeMode } from '../../types';

const PulseBackground: React.FC<DynamicBackgroundProps> = ({ 
    analyser,
    theme, 
    extractedColor,
    opacity = 0.3 
}) => {
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

        const bufferLength = analyser?.frequencyBinCount || 128;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
            }
            
            // Колір залежно від теми
            const isMono = theme === ThemeMode.MONO || theme === ThemeMode.BLACK_WHITE;
            const r = isMono ? 255 : (extractedColor?.r ?? 255);
            const g = isMono ? 255 : (extractedColor?.g ?? 255);
            const b = isMono ? 255 : (extractedColor?.b ?? 255);
            
            // Баси для пульсації
            const bass = analyser 
                ? dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 
                : 128;
            const pulse = bass / 255;
            
            // Малюємо пульсуючі кола
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
            
            for (let i = 5; i > 0; i--) {
                const radius = maxRadius * (i / 5) * (0.8 + pulse * 0.4);
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(0.15 / i) * opacity})`;
                ctx.lineWidth = 2 + pulse * 2;
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, theme, extractedColor, opacity]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        />
    );
};

export default PulseBackground;

export const pulseBackgroundMeta: DynamicBackgroundMeta = {
    id: 'pulse',
    name: 'Pulse',
    description: 'Пульсуючі кола, що реагують на баси',
    category: 'audio-reactive',
    requiresAudio: true,
};
```
