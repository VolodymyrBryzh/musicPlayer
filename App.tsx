import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import Visualizer from './components/Visualizer';
import DynamicBackground from './components/DynamicBackground';
import SettingsPanel from './components/SettingsPanel';
import PlayerControls from './components/PlayerControls';
import QueueList from './components/QueueList';
import { ThemeMode, BackgroundMode, SongMetadata, PlayerState, Track } from './types';
import { parseMetadata, getAudioFilesFromDataTransfer } from './utils/audioHelpers';
import { updateMediaSession, initMediaSession, scanMusicFiles, isAndroid } from './utils/androidBridge';

const App: React.FC = () => {
    // State
    const [originalTracks, setOriginalTracks] = useState<Track[]>([]);
    const [activePlaylist, setActivePlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [theme, setTheme] = useState<ThemeMode>(ThemeMode.MONO);
    const [activeBackgrounds, setActiveBackgrounds] = useState<BackgroundMode[]>([]);
    const [mobileView, setMobileView] = useState<'player' | 'settings' | 'queue'>('player');
    const [metadata, setMetadata] = useState<SongMetadata>({
        title: 'Waiting...',
        artist: 'Select folder to start',
        coverUrl: null,
        color: null
    });
    const [playerState, setPlayerState] = useState<PlayerState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isShuffle: false,
        isRepeatOne: false
    });

    // Audio Refs
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    // Initialize AudioContext on user interaction
    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            const analyserNode = ctx.createAnalyser();
            analyserNode.fftSize = 256;

            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyserNode);
            analyserNode.connect(ctx.destination);

            audioContextRef.current = ctx;
            analyserRef.current = analyserNode;
            sourceRef.current = source;
            setAnalyser(analyserNode);
        } else if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    // Load Track Logic
    const loadTrack = async (index: number, tracks: Track[] = activePlaylist) => {
        if (tracks.length === 0) return;

        const track = tracks[index];
        const audio = audioRef.current;

        // Revoke previous cover URL if it was a blob
        if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
            URL.revokeObjectURL(metadata.coverUrl);
        }

        // Load metadata
        const meta = await parseMetadata(track.file || track.path!);
        setMetadata(meta);

        // Update Android Media Session
        updateMediaSession({
            title: meta.title,
            artist: meta.artist,
            coverUrl: meta.coverUrl
        });

        // Load Audio
        let src = '';
        if (track.url) {
            src = track.url;
        } else if (track.file) {
            src = URL.createObjectURL(track.file);
        }

        // Revoke previous audio object URL if it was a blob
        if (audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
        }

        audio.src = src;
        audio.load();

        initAudioContext();

        try {
            await audio.play();
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
        } catch (e) {
            console.error("Autoplay prevented", e);
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
        }
    };

    const handleTracksAdded = (newTracks: Track[]) => {
        const sorted = newTracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        setOriginalTracks(sorted);

        // Automatically enable shuffle when importing
        setPlayerState(prev => ({ ...prev, isShuffle: true }));

        // Shuffle the playlist immediately
        let newPlaylist = [...sorted].sort(() => Math.random() - 0.5);
        let startIndex = 0;

        setActivePlaylist(newPlaylist);
        setCurrentTrackIndex(startIndex);
        loadTrack(startIndex, newPlaylist);
    };

    const playNext = () => {
        if (activePlaylist.length === 0) return;
        const nextIndex = (currentTrackIndex + 1) % activePlaylist.length;
        setCurrentTrackIndex(nextIndex);
        loadTrack(nextIndex);
    };

    const playPrev = () => {
        if (activePlaylist.length === 0) return;
        const prevIndex = (currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length;
        setCurrentTrackIndex(prevIndex);
        loadTrack(prevIndex);
    };

    const playNextRef = useRef(playNext);
    playNextRef.current = playNext;

    const playPrevRef = useRef(playPrev);
    playPrevRef.current = playPrev;

    const isRepeatOneRef = useRef(playerState.isRepeatOne);
    isRepeatOneRef.current = playerState.isRepeatOne;

    useEffect(() => {
        const audio = audioRef.current;
        audio.crossOrigin = "anonymous";

        const updateTime = () => setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));
        const updateDuration = () => setPlayerState(prev => ({ ...prev, duration: audio.duration }));

        const handleEnded = () => {
            if (isRepeatOneRef.current) {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNextRef.current();
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        // Initialize Media Session for Android
        initMediaSession({
            onPlay: () => audio.play(),
            onPause: () => audio.pause(),
            onNext: () => playNextRef.current(),
            onPrev: () => playPrevRef.current(),
            onSeek: (time) => { audio.currentTime = time; }
        });

        // Auto-scan music if on Android
        if (isAndroid) {
            setTimeout(() => {
                scanMusicFiles().then(tracks => {
                    if (tracks.length > 0) {
                        handleTracksAdded(tracks);
                    }
                });
            }, 1000); // Give some time for everything to initialize
        }

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (activePlaylist.length === 0) return;
        initAudioContext();
        if (audioRef.current.paused) {
            audioRef.current.play();
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
        } else {
            audioRef.current.pause();
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
        }
    };

    const toggleShuffle = () => {
        const newShuffleState = !playerState.isShuffle;
        setPlayerState(prev => ({ ...prev, isShuffle: newShuffleState }));

        if (activePlaylist.length === 0) return;

        const currentTrack = activePlaylist[currentTrackIndex];
        let newPlaylist: Track[];
        let newIndex = 0;

        if (newShuffleState) {
            const others = originalTracks.filter(t => t !== currentTrack);
            const shuffledOthers = others.sort(() => Math.random() - 0.5);
            newPlaylist = [currentTrack, ...shuffledOthers];
            newIndex = 0;
        } else {
            newPlaylist = [...originalTracks];
            newIndex = newPlaylist.indexOf(currentTrack);
            if (newIndex === -1) newIndex = 0;
        }

        setActivePlaylist(newPlaylist);
        setCurrentTrackIndex(newIndex);
    };

    const toggleBackgroundMode = (mode: BackgroundMode) => {
        if (mode === BackgroundMode.NONE) {
            setActiveBackgrounds([]);
            return;
        }
        setActiveBackgrounds(prev => {
            if (prev.includes(mode)) {
                return prev.filter(m => m !== mode);
            } else {
                return [...prev, mode];
            }
        });
    };

    const seek = (percentage: number) => {
        if (audioRef.current) {
            const newTime = (percentage / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setPlayerState(prev => ({ ...prev, currentTime: newTime }));
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = await getAudioFilesFromDataTransfer(e.dataTransfer);
        if (files.length > 0) handleTracksAdded(files.map(f => ({ name: f.name, file: f })));
    };

    const getThemeStyles = (): CSSProperties => {
        const { color } = metadata;
        const r = color?.r ?? 255;
        const g = color?.g ?? 255;
        const b = color?.b ?? 255;

        const baseStyles = {
            '--text': '#e0e0e0',
            '--subtext': '#555555',
            '--slider-bg': '#2a2a2a',
        };

        if (theme === ThemeMode.BLACK_WHITE) {
            return {
                ...baseStyles,
                '--bg': '#000000',
                '--surface-main': 'rgba(0, 0, 0, 0.85)',
                '--surface-side': 'rgba(0, 0, 0, 0.7)',
                '--primary': '#ffffff',
                '--slider-fill': '#ffffff',
                '--text': '#ffffff',
                '--subtext': '#888888',
                '--border': '#333333',
                '--slider-bg': '#333333',
            } as CSSProperties;
        } else if (theme === ThemeMode.MONO) {
            return {
                ...baseStyles,
                '--bg': '#050505',
                '--surface-main': 'rgba(20, 20, 20, 0.85)',
                '--surface-side': 'rgba(14, 14, 14, 0.7)',
                '--primary': '#ffffff',
                '--slider-fill': '#ffffff',
                '--border': 'rgba(31, 31, 31, 0.5)',
            } as CSSProperties;
        } else if (theme === ThemeMode.ACCENT) {
            return {
                ...baseStyles,
                '--bg': '#050505',
                '--surface-main': 'rgba(20, 20, 20, 0.85)',
                '--surface-side': 'rgba(14, 14, 14, 0.7)',
                '--primary': `rgb(${r},${g},${b})`,
                '--slider-fill': `rgb(${r},${g},${b})`,
                '--border': 'rgba(31, 31, 31, 0.5)',
            } as CSSProperties;
        } else {
            return {
                ...baseStyles,
                '--bg': `rgb(${Math.floor(r * 0.1)},${Math.floor(g * 0.1)},${Math.floor(b * 0.1)})`,
                '--surface-main': `rgba(${Math.floor(r * 0.15)},${Math.floor(g * 0.15)},${Math.floor(b * 0.15)}, 0.8)`,
                '--surface-side': `rgba(${Math.floor(r * 0.15)},${Math.floor(g * 0.15)},${Math.floor(b * 0.15)}, 0.6)`,
                '--primary': `rgb(${Math.min(r + 50, 255)},${Math.min(g + 50, 255)},${Math.min(b + 50, 255)})`,
                '--text': '#ffffff',
                '--slider-fill': `rgb(${r},${g},${b})`,
                '--border': `rgba(${r},${g},${b}, 0.1)`,
            } as CSSProperties;
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div
            className="flex justify-center items-center h-[100dvh] w-screen overflow-hidden select-none font-sans bg-black"
            style={getThemeStyles()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDoubleClick={toggleFullScreen}
        >
            <DynamicBackground
                activeModes={activeBackgrounds}
                theme={theme}
                extractedColor={metadata.color}
            />

            <Visualizer
                analyser={analyser}
                theme={theme}
                extractedColor={metadata.color}
            />

            <div className="flex flex-col md:flex-row items-center justify-center relative z-20 w-full h-full p-4 md:p-8 overflow-hidden">
                <SettingsPanel
                    currentTheme={theme}
                    onSetTheme={setTheme}
                    activeBackgrounds={activeBackgrounds}
                    onToggleBgMode={toggleBackgroundMode}
                    isOpenMobile={mobileView === 'settings'}
                    onCloseMobile={() => setMobileView('player')}
                />

                <PlayerControls
                    metadata={metadata}
                    playerState={playerState}
                    theme={theme}
                    onTogglePlay={togglePlay}
                    onNext={playNext}
                    onPrev={playPrev}
                    onToggleShuffle={toggleShuffle}
                    onToggleRepeat={() => setPlayerState(prev => ({ ...prev, isRepeatOne: !prev.isRepeatOne }))}
                    onSeek={seek}
                    onOpenSettings={() => setMobileView('settings')}
                    onOpenQueue={() => setMobileView('queue')}
                />

                <QueueList
                    playlist={activePlaylist}
                    currentTrackIndex={currentTrackIndex}
                    onTrackSelect={(idx) => { setCurrentTrackIndex(idx); loadTrack(idx); }}
                    onTracksAdded={handleTracksAdded}
                    isOpenMobile={mobileView === 'queue'}
                    onCloseMobile={() => setMobileView('player')}
                />
            </div>
        </div>
    );
};

export default App;