import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import Visualizer from './components/Visualizer';
import DynamicBackground from './components/DynamicBackground';
import SettingsPanel from './components/SettingsPanel';
import PlayerControls from './components/PlayerControls';
import QueueList from './components/QueueList';
import { ThemeMode, BackgroundMode, SongMetadata, PlayerState } from './types';
import { parseMetadata, getAudioFilesFromDataTransfer } from './utils/audioHelpers';

const App: React.FC = () => {
    // State
    const [originalFiles, setOriginalFiles] = useState<File[]>([]);
    const [activePlaylist, setActivePlaylist] = useState<File[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [theme, setTheme] = useState<ThemeMode>(ThemeMode.MONO);
    // Background Mode is now an array to support multiple simultaneous effects
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
    const loadTrack = async (index: number, files: File[] = activePlaylist) => {
        if (files.length === 0) return;

        const file = files[index];
        const audio = audioRef.current;

        // Revoke previous cover URL to prevent memory leaks
        if (metadata.coverUrl) {
            URL.revokeObjectURL(metadata.coverUrl);
        }

        // Load metadata
        const meta = await parseMetadata(file);
        setMetadata(meta);

        // Load Audio
        const objectUrl = URL.createObjectURL(file);
        // Revoke previous audio object URL if it was a blob
        if (audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
        }

        audio.src = objectUrl;
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

    const handleFilesSelected = (files: File[]) => {
        const sorted = files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        setOriginalFiles(sorted);

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

    // Refs to hold latest functions/state for event listeners
    const playNextRef = useRef(playNext);
    playNextRef.current = playNext;

    const isRepeatOneRef = useRef(playerState.isRepeatOne);
    isRepeatOneRef.current = playerState.isRepeatOne;

    // Initial Audio Setup with stable event listeners
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

        const currentFile = activePlaylist[currentTrackIndex];
        let newPlaylist: File[];
        let newIndex = 0;

        if (newShuffleState) {
            const others = originalFiles.filter(f => f !== currentFile);
            const shuffledOthers = others.sort(() => Math.random() - 0.5);
            newPlaylist = [currentFile, ...shuffledOthers];
            newIndex = 0;
        } else {
            newPlaylist = [...originalFiles];
            newIndex = newPlaylist.indexOf(currentFile);
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
        if (files.length > 0) handleFilesSelected(files);
    };

    // Construct Dynamic CSS Variables based on Theme
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
            // Adaptive
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
            className="flex justify-center items-center h-screen w-screen overflow-hidden select-none font-sans"
            style={getThemeStyles()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDoubleClick={toggleFullScreen}
        >
            {/* Background Layer z-[1] */}
            <DynamicBackground
                activeModes={activeBackgrounds}
                theme={theme}
                extractedColor={metadata.color}
            />

            {/* Visualizer Layer z-[2] */}
            <Visualizer
                analyser={analyser}
                theme={theme}
                extractedColor={metadata.color}
            />

            {/* UI Layer z-10/20 */}
            <div className="flex flex-col md:flex-row items-center justify-center relative z-20 w-full h-full md:w-auto md:h-auto">
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
                    onFilesSelected={handleFilesSelected}
                    isOpenMobile={mobileView === 'queue'}
                    onCloseMobile={() => setMobileView('player')}
                />
            </div>
        </div>
    );
};

export default App;