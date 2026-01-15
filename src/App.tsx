import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import Visualizer from './components/Visualizer';
import SettingsPanel from './components/SettingsPanel';
import PlayerControls from './components/PlayerControls';
import QueueList from './components/QueueList';
import { ThemeMode, SongMetadata, PlayerState, Track, BackgroundImage } from './types';
import { scanDirectory, scanLocal, scanFiles, getCoverArt, convertFileSrc, coverArtToDataUrl, getBackgrounds, onFileDrop } from './utils/tauri';
import { extractDominantColor } from './utils/audioHelpers';

const App: React.FC = () => {
    // State
    const [originalTracks, setOriginalTracks] = useState<Track[]>([]);
    const [activePlaylist, setActivePlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [theme, setTheme] = useState<ThemeMode>(ThemeMode.MONO);
    const [mobileView, setMobileView] = useState<'player' | 'settings' | 'queue'>('player');
    const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
    const [currentBackground, setCurrentBackground] = useState<string | null>(null);
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
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
    
    // Refs for stable event listeners (fix from web branch)
    const playNextRef = useRef<() => void>(() => {});
    const isRepeatOneRef = useRef(playerState.isRepeatOne);

    // Load backgrounds on mount
    useEffect(() => {
        const loadBackgrounds = async () => {
            try {
                const bgs = await getBackgrounds();
                setBackgrounds(bgs);
            } catch (e) {
                console.error("Failed to load backgrounds", e);
            }
        };
        loadBackgrounds();
    }, []);

    // Drag & Drop support
    useEffect(() => {
        let unlisten: (() => void) | null = null;
        
        const setupDragDrop = async () => {
            unlisten = await onFileDrop(async (paths) => {
                try {
                    const tracks = await scanFiles(paths);
                    if (tracks.length === 0) {
                        setMetadata({
                            title: 'No audio files',
                            artist: 'Drop MP3 files or folders',
                            coverUrl: null,
                            color: null
                        });
                        return;
                    }
                    const sorted = tracks.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
                    setOriginalTracks(sorted);
                    
                    let newPlaylist = [...sorted];
                    let startIndex = 0;

                    if (playerState.isShuffle) {
                        newPlaylist = newPlaylist.sort(() => Math.random() - 0.5);
                    } else if (newPlaylist.length > 0) {
                        startIndex = Math.floor(Math.random() * newPlaylist.length);
                    }
                    
                    setActivePlaylist(newPlaylist);
                    setCurrentTrackIndex(startIndex);
                    loadTrack(startIndex, newPlaylist);
                } catch (e) {
                    console.error("Failed to scan dropped files", e);
                }
            });
        };
        
        setupDragDrop();
        
        return () => {
            if (unlisten) unlisten();
        };
    }, [playerState.isShuffle]);

    // Fullscreen toggle using Rust command
    const toggleFullscreen = async () => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('toggle_fullscreen');
        } catch (err) {
            console.error('Fullscreen toggle failed', err);
        }
    };

    // F11 and Escape for fullscreen control
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // F11 to toggle fullscreen
            if (e.key === 'F11') {
                e.preventDefault();
                e.stopPropagation();
                await toggleFullscreen();
                return;
            }
            
            // Escape to exit fullscreen
            if (e.key === 'Escape') {
                try {
                    const { getCurrentWindow } = await import('@tauri-apps/api/window');
                    const win = getCurrentWindow();
                    const isFullscreen = await win.isFullscreen();
                    if (isFullscreen) {
                        await toggleFullscreen();
                    }
                } catch (err) {
                    console.error('Escape handler failed', err);
                }
            }
        };
        
        // Capture phase to intercept before browser
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    // Update background URL when currentBackground changes
    useEffect(() => {
        const updateBgUrl = async () => {
            if (currentBackground) {
                const url = await convertFileSrc(currentBackground);
                setBackgroundUrl(url);
            } else {
                setBackgroundUrl(null);
            }
        };
        updateBgUrl();
    }, [currentBackground]);

    // Initial Audio Setup with stable event listeners (fix from web branch)
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
    }, []); // Run once, rely on refs for dynamic logic

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

        // Revoke previous cover URL to prevent memory leaks
        if (metadata.coverUrl && metadata.coverUrl.startsWith('blob:')) {
            URL.revokeObjectURL(metadata.coverUrl);
        }
        
        // Load metadata from track and cover art
        let coverUrl: string | null = null;
        let color: { r: number; g: number; b: number } | null = null;
        
        try {
            const coverArt = await getCoverArt(track.path);
            if (coverArt) {
                coverUrl = coverArtToDataUrl(coverArt);
                color = await extractDominantColor(coverUrl);
            }
        } catch (e) {
            console.error("Failed to load cover art", e);
        }
        
        setMetadata({
            title: track.title || track.filename.replace(/\.[^/.]+$/, ""),
            artist: track.artist || 'Unknown Artist',
            coverUrl,
            color
        });

        // Load Audio using Tauri asset protocol
        const audioUrl = await convertFileSrc(track.path);
        audio.src = audioUrl;
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

    const handleFolderSelected = async (folderPath: string) => {
        try {
            const tracks = await scanDirectory(folderPath);
            const sorted = tracks.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
            setOriginalTracks(sorted);
            
            let newPlaylist = [...sorted];
            let startIndex = 0;

            // If shuffle is ON, randomize playlist
            // If shuffle is OFF, keep A-Z but start at a random song
            if (playerState.isShuffle) {
                newPlaylist = newPlaylist.sort(() => Math.random() - 0.5);
            } else if (newPlaylist.length > 0) {
                startIndex = Math.floor(Math.random() * newPlaylist.length);
            }
            
            setActivePlaylist(newPlaylist);
            setCurrentTrackIndex(startIndex);
            loadTrack(startIndex, newPlaylist);
        } catch (e) {
            console.error("Failed to scan directory", e);
        }
    };

    const handleScanLocal = async () => {
        try {
            const tracks = await scanLocal();
            if (tracks.length === 0) {
                setMetadata({
                    title: 'No music found',
                    artist: 'Put MP3 files next to the app',
                    coverUrl: null,
                    color: null
                });
                return;
            }
            const sorted = tracks.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
            setOriginalTracks(sorted);
            
            let newPlaylist = [...sorted];
            let startIndex = 0;

            if (playerState.isShuffle) {
                newPlaylist = newPlaylist.sort(() => Math.random() - 0.5);
            } else if (newPlaylist.length > 0) {
                startIndex = Math.floor(Math.random() * newPlaylist.length);
            }
            
            setActivePlaylist(newPlaylist);
            setCurrentTrackIndex(startIndex);
            loadTrack(startIndex, newPlaylist);
        } catch (e) {
            console.error("Failed to scan local", e);
        }
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

    // Update refs with current values
    playNextRef.current = playNext;
    isRepeatOneRef.current = playerState.isRepeatOne;

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

        if (newShuffleState) {
            // Enable Shuffle
            const others = originalTracks.filter(t => t.id !== currentTrack.id);
            const shuffledOthers = others.sort(() => Math.random() - 0.5);
            newPlaylist = [currentTrack, ...shuffledOthers];
            setCurrentTrackIndex(0);
        } else {
            // Disable Shuffle (restore original order)
            newPlaylist = [...originalTracks];
            const newIndex = newPlaylist.findIndex(t => t.id === currentTrack.id);
            setCurrentTrackIndex(newIndex !== -1 ? newIndex : 0);
        }
        setActivePlaylist(newPlaylist);
    };

    const seek = (percentage: number) => {
        if (audioRef.current) {
            const newTime = (percentage / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setPlayerState(prev => ({ ...prev, currentTime: newTime }));
        }
    };

    // Drag & drop is not supported in Tauri native mode
    // Files must be selected via folder dialog

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

        if (theme === ThemeMode.MONO) {
            return {
                ...baseStyles,
                '--bg': '#050505',
                '--surface-main': '#141414',
                '--surface-side': '#0e0e0e',
                '--primary': '#ffffff',
                '--slider-fill': '#ffffff',
                '--border': '#1f1f1f',
            } as CSSProperties;
        } else if (theme === ThemeMode.ACCENT) {
            return {
                ...baseStyles,
                '--bg': '#050505',
                '--surface-main': '#141414',
                '--surface-side': '#0e0e0e',
                '--primary': `rgb(${r},${g},${b})`,
                '--slider-fill': `rgb(${r},${g},${b})`,
                '--border': '#1f1f1f',
            } as CSSProperties;
        } else {
            // Adaptive
            return {
                ...baseStyles,
                '--bg': `rgb(${Math.floor(r * 0.1)},${Math.floor(g * 0.1)},${Math.floor(b * 0.1)})`,
                '--surface-main': `rgb(${Math.floor(r * 0.15)},${Math.floor(g * 0.15)},${Math.floor(b * 0.15)})`,
                '--surface-side': `rgba(${Math.floor(r * 0.15)},${Math.floor(g * 0.15)},${Math.floor(b * 0.15)}, 0.6)`,
                '--primary': `rgb(${Math.min(r + 50, 255)},${Math.min(g + 50, 255)},${Math.min(b + 50, 255)})`,
                '--text': '#ffffff',
                '--slider-fill': `rgb(${r},${g},${b})`,
                '--border': `rgba(${r},${g},${b}, 0.1)`,
            } as CSSProperties;
        }
    };

    return (
        <div 
            className="flex justify-center items-center h-screen w-screen overflow-hidden select-none font-sans"
            style={getThemeStyles()}
        >
            {/* Custom Background Image - double click for fullscreen */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat cursor-pointer"
                style={backgroundUrl ? { 
                    backgroundImage: `url(${backgroundUrl})`,
                    filter: 'brightness(0.3) saturate(0.8)'
                } : {}}
                onDoubleClick={toggleFullscreen}
            />
            
            {/* Background Visualizer */}
            <Visualizer 
                analyser={analyser} 
                theme={theme} 
                extractedColor={metadata.color} 
            />

            <div className="flex flex-col md:flex-row items-center justify-center relative z-10 w-full h-full md:w-auto md:h-auto">
                <SettingsPanel 
                    currentTheme={theme} 
                    onSetTheme={setTheme}
                    backgrounds={backgrounds}
                    currentBackground={currentBackground}
                    onSetBackground={setCurrentBackground}
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
                    onFolderSelected={handleFolderSelected}
                    onScanLocal={handleScanLocal}
                    isOpenMobile={mobileView === 'queue'}
                    onCloseMobile={() => setMobileView('player')}
                />
            </div>
        </div>
    );
};

export default App;