export enum ThemeMode {
    MONO = 'mono',
    ACCENT = 'accent',
    ADAPTIVE = 'adaptive',
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
