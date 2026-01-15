export enum ThemeMode {
    MONO = 'mono',
    ACCENT = 'accent',
    ADAPTIVE = 'adaptive',
    BLACK_WHITE = 'black_white',
}

export enum BackgroundMode {
    NONE = 'none',
    AURORA = 'aurora',
    PARTICLES = 'particles',
}

export interface SongMetadata {
    title: string;
    artist: string;
    coverUrl: string | null;
    color: { r: number; g: number; b: number } | null;
}

export interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isShuffle: boolean;
    isRepeatOne: boolean;
}

// Tauri types
export interface Track {
    id: number;
    path: string;
    filename: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    duration: number | null;
}

export interface CoverArt {
    data: string; // Base64 encoded
    mime_type: string;
}

export interface BackgroundImage {
    path: string;
    name: string;
}