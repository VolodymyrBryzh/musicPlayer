import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@jofr/capacitor-media-session';

export const isAndroid = Capacitor.getPlatform() === 'android';

export const updateMediaSession = async (metadata: { title: string; artist: string; coverUrl: string | null }) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await MediaSession.setMetadata({
            title: metadata.title,
            artist: metadata.artist,
            album: 'Monochrome Player',
            artwork: metadata.coverUrl ? [{ src: metadata.coverUrl, sizes: '512x512', type: 'image/png' }] : []
        });
    } catch (e) {
        console.error("Failed to update media session", e);
    }
};

export const initMediaSession = (handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (time: number) => void;
}) => {
    if (!Capacitor.isNativePlatform()) return;

    MediaSession.setActionHandler({ action: 'play' }, handlers.onPlay);
    MediaSession.setActionHandler({ action: 'pause' }, handlers.onPause);
    MediaSession.setActionHandler({ action: 'nexttrack' }, handlers.onNext);
    MediaSession.setActionHandler({ action: 'previoustrack' }, handlers.onPrev);
    MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
        if (details.seekTime !== undefined) handlers.onSeek(details.seekTime);
    });
};
