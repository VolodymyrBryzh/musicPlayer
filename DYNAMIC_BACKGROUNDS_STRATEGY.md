# 🎬 Стратегія Динамічних Фонів для Monochrome Player

## 📋 Огляд

Динамічні фони додають візуальну глибину та інтерактивність до плеєра. Цей документ описує стратегію реалізації підтримки різних форматів динамічних фонів.

---

## 🎯 Вимоги

1. **Простота додавання** - користувач має змогу просто покласти файл у папку
2. **Продуктивність** - мінімальне навантаження на CPU/GPU
3. **Сумісність** - працює на Windows (Tauri Desktop)
4. **Гнучкість** - підтримка різних форматів

---

## 📦 Підтримувані Формати

### 1. **MP4/WebM Відео** ⭐ Рекомендовано

**Переваги:**
- ✅ Найпростіше для користувача (просто покласти файл)
- ✅ Висока якість
- ✅ Підтримка аудіо (можна вимкнути)
- ✅ Стандартний формат

**Реалізація:**
```html
<video 
    autoplay 
    loop 
    muted 
    playsinline
    className="fixed inset-0 w-full h-full object-cover z-0"
    style={{ opacity: 0.3 }}
>
    <source src={videoPath} type="video/mp4" />
</video>
```

**Структура:**
```
backgrounds/
  ├── static/
  │   ├── image1.png
  │   └── image2.jpg
  └── dynamic/
      ├── wave.mp4
      ├── particles.webm
      └── abstract.mp4
```

**Обмеження:**
- Потрібен кодек (MP4 H.264 - стандартний)
- Розмір файлів може бути великим

---

### 2. **HTML/CSS Анімації** 🎨

**Переваги:**
- ✅ Легкі файли
- ✅ Повний контроль
- ✅ Можна інтегрувати з аудіо (реакція на музику)
- ✅ Без залежностей

**Реалізація:**
```typescript
// backgrounds/dynamic/wave.html
<div id="wave-container">
  <canvas id="wave-canvas"></canvas>
  <script>
    // Анімація хвиль
  </script>
</div>
```

**Завантаження:**
```typescript
// В Tauri можна завантажити HTML як iframe або через convertFileSrc
const htmlPath = await convertFileSrc('backgrounds/dynamic/wave.html');
<iframe src={htmlPath} className="fixed inset-0 w-full h-full border-none pointer-events-none" />
```

**Структура:**
```
backgrounds/
  └── dynamic/
      ├── wave.html
      ├── particles.html
      └── gradient.html
```

**Обмеження:**
- Потрібна ізоляція (iframe)
- Можливі проблеми з безпекою

---

### 3. **Canvas/WebGL Анімації** 🎮

**Переваги:**
- ✅ Висока продуктивність
- ✅ Реакція на аудіо в реальному часі
- ✅ Плавні анімації

**Реалізація:**
```typescript
// React компонент для Canvas анімації
const DynamicCanvasBackground = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Анімація на основі аудіо
    const animate = () => {
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        // Рендер на canvas
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, [analyser]);
  
  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};
```

**Структура:**
```
src/
  └── components/
      └── backgrounds/
          ├── WaveBackground.tsx
          ├── ParticleBackground.tsx
          └── GradientBackground.tsx
```

**Обмеження:**
- Потрібно вбудовувати в код
- Не так просто додавати нові (потрібна перекомпіляція)

---

## 🏗️ Рекомендована Архітектура

### **Гібридний Підхід: MP4 + HTML**

1. **MP4 для статичних анімацій** (хвилі, частинки, абстракції)
   - Користувач просто кладе файл
   - Автоматично виявляється
   - Працює "з коробки"

2. **HTML для інтерактивних** (реакція на музику)
   - Опціонально
   - Більше контролю
   - Можна додати пізніше

---

## 📁 Структура Файлів

```
backgrounds/
  ├── static/          # Статичні зображення (PNG, JPG)
  │   ├── bg1.png
  │   └── bg2.jpg
  └── dynamic/         # Динамічні фони
      ├── wave.mp4     # Відео
      ├── particles.mp4
      └── interactive.html  # HTML анімації (опціонально)
```

---

## 🔧 Реалізація (MP4)

### 1. **Оновлення Rust Backend**

```rust
// src-tauri/src/main.rs

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackgroundFile {
    pub path: String,
    pub name: String,
    pub r#type: String, // "image" | "video" | "html"
}

#[tauri::command]
fn get_backgrounds() -> Result<Vec<BackgroundFile>, String> {
    let mut backgrounds: Vec<BackgroundFile> = Vec::new();
    
    // Статичні зображення
    let image_exts = ["png", "jpg", "jpeg", "webp", "gif"];
    // Відео
    let video_exts = ["mp4", "webm", "mov"];
    
    // Сканування...
    
    Ok(backgrounds)
}
```

### 2. **Оновлення TypeScript Types**

```typescript
// src/types.ts
export interface BackgroundFile {
    path: string;
    name: string;
    type: 'image' | 'video' | 'html';
}
```

### 3. **React Компонент для Відео**

```typescript
// src/components/VideoBackground.tsx
import React from 'react';
import { convertFileSrc } from '../utils/tauri';

interface VideoBackgroundProps {
    videoPath: string | null;
    opacity?: number;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
    videoPath, 
    opacity = 0.3 
}) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (videoPath) {
            convertFileSrc(videoPath).then(setVideoUrl);
        } else {
            setVideoUrl(null);
        }
    }, [videoPath]);
    
    if (!videoUrl) return null;
    
    return (
        <video
            autoPlay
            loop
            muted
            playsInline
            className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
            style={{ opacity }}
        >
            <source src={videoUrl} type="video/mp4" />
        </video>
    );
};

export default VideoBackground;
```

### 4. **Оновлення App.tsx**

```typescript
// src/App.tsx
import VideoBackground from './components/VideoBackground';

// В state
const [currentBackground, setCurrentBackground] = useState<BackgroundFile | null>(null);

// В render
{currentBackground?.type === 'video' && (
    <VideoBackground videoPath={currentBackground.path} />
)}
{currentBackground?.type === 'image' && (
    <div style={{ backgroundImage: `url(${backgroundUrl})` }} />
)}
```

---

## ⚙️ Налаштування Продуктивності

### **MP4 Оптимізація:**

1. **Розмір відео:**
   - Рекомендовано: 1920x1080 або менше
   - Бітрейт: 2-5 Mbps
   - FPS: 30 (достатньо для фону)

2. **Кодек:**
   - H.264 (найкраща сумісність)
   - VP9 (менший розмір, але менша підтримка)

3. **Тривалість:**
   - 10-30 секунд (loop)
   - Без звуку (muted)

---

## 🎨 Приклади Використання

### **MP4 Фони:**
- Абстрактні хвилі
- Частинки
- Градієнти
- Геометричні фігури
- Космос/зірки

### **HTML Анімації (майбутнє):**
- Реакція на баси
- Частоти в реальному часі
- Інтерактивні ефекти

---

## 📝 План Реалізації

### **Фаза 1: MP4 Підтримка** ✅
- [x] Оновити Rust backend для виявлення MP4
- [ ] Створити VideoBackground компонент
- [ ] Інтегрувати в App.tsx
- [ ] Тестування продуктивності

### **Фаза 2: Оптимізація** (опціонально)
- [ ] Lazy loading відео
- [ ] Preload першого кадру
- [ ] Кешування

### **Фаза 3: HTML Підтримка** (майбутнє)
- [ ] Iframe для HTML фонів
- [ ] Безпека (sandbox)
- [ ] API для передачі аудіо даних

---

## 🚀 Швидкий Старт

1. **Покласти MP4 файл:**
   ```
   backgrounds/dynamic/wave.mp4
   ```

2. **Автоматично з'явиться в Settings → Background**

3. **Обрати і насолоджуватися!**

---

## 💡 Рекомендації

- **MP4** - найпростіше рішення для більшості випадків
- **HTML** - для просунутих користувачів та інтерактивних ефектів
- **Canvas** - для інтеграції з аудіо (вбудовано в код)

**Висновок:** Почати з **MP4**, додати **HTML** пізніше за потреби.
