import { Track, CoverArt, BackgroundImage } from '../types';

// Check if running in Tauri
export const isTauri = (): boolean => {
    return '__TAURI__' in window;
};

// Tauri invoke wrapper
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (isTauri()) {
        const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        return tauriInvoke<T>(cmd, args);
    }
    throw new Error('Not running in Tauri environment');
}

// Scan directory for audio files
export async function scanDirectory(path: string): Promise<Track[]> {
    return invoke<Track[]>('scan_directory', { path });
}

// Scan local folder (where app is located) for audio files
export async function scanLocal(): Promise<Track[]> {
    return invoke<Track[]>('scan_local');
}

// Get cover art from audio file
export async function getCoverArt(path: string): Promise<CoverArt | null> {
    return invoke<CoverArt | null>('get_cover_art', { path });
}

// Get background images from app's backgrounds folder
export async function getBackgrounds(): Promise<BackgroundImage[]> {
    return invoke<BackgroundImage[]>('get_backgrounds');
}

// Get app directory path
export async function getAppDir(): Promise<string> {
    return invoke<string>('get_app_dir');
}

// Open folder dialog
export async function openFolderDialog(): Promise<string | null> {
    if (isTauri()) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const result = await open({
            directory: true,
            multiple: false,
            title: 'Select Music Folder',
        });
        return result as string | null;
    }
    return null;
}

// Convert file path to asset URL for Tauri
export async function convertFileSrc(path: string): Promise<string> {
    if (isTauri() && path) {
        const { convertFileSrc: tauriConvert } = await import('@tauri-apps/api/core');
        return tauriConvert(path);
    }
    return path;
}

// Convert base64 cover art to data URL
export function coverArtToDataUrl(coverArt: CoverArt): string {
    return `data:${coverArt.mime_type};base64,${coverArt.data}`;
}

// Listen for file drop events
export async function onFileDrop(callback: (paths: string[]) => void): Promise<() => void> {
    if (isTauri()) {
        const { listen } = await import('@tauri-apps/api/event');
        const unlisten = await listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
            if (event.payload.paths && event.payload.paths.length > 0) {
                callback(event.payload.paths);
            }
        });
        return unlisten;
    }
    return () => {};
}

// Scan specific files for audio
export async function scanFiles(paths: string[]): Promise<Track[]> {
    return invoke<Track[]>('scan_files', { paths });
}