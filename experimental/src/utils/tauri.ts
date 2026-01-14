import { Track, CoverArt } from '../types';

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

// Get cover art from audio file
export async function getCoverArt(path: string): Promise<CoverArt | null> {
    return invoke<CoverArt | null>('get_cover_art', { path });
}

// Get background images from directory
export async function getBackgrounds(path: string): Promise<string[]> {
    return invoke<string[]>('get_backgrounds', { path });
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
export function convertFileSrc(path: string): string {
    if (isTauri() && path) {
        // Tauri 2.0 uses convertFileSrc from @tauri-apps/api/core
        return `asset://localhost/${encodeURIComponent(path)}`;
    }
    return path;
}

// Convert base64 cover art to data URL
export function coverArtToDataUrl(coverArt: CoverArt): string {
    return `data:${coverArt.mime_type};base64,${coverArt.data}`;
}
