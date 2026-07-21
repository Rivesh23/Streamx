import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { youtubeAudioApi } from './services/youtubeAudioApi';

export interface Track {
    id: string;
    youtubeId?: string;
    isYouTube?: boolean;
    title: string;
    artist: string;
    artistId?: string;
    album: string;
    albumId?: string;
    artworkUrl: string;
    previewUrl: string | null;
    downloadUrl?: string | null;
    trackViewUrl?: string;
    durationMs: number;
    genre?: string;
    hasSyncedLyrics?: boolean;
}

export type EQPreset = 'Flat' | 'Bass Boost' | 'Vocal' | 'Treble Boost' | 'Electronic';

interface AudioContextValue {
    currentTrack: Track | null;
    queue: Track[];
    history: Track[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    repeat: 'none' | 'one' | 'all';
    shuffle: boolean;
    eqPreset: EQPreset;
    analyserNode: AnalyserNode | null;
    showLyricsDrawer: boolean;
    loadingStream: boolean;
    playTrack: (track: Track) => void;
    playNext: () => void;
    playPrev: () => void;
    togglePlay: () => void;
    addToQueue: (track: Track) => void;
    playNow: (track: Track) => void;
    playNextInQueue: (track: Track) => void;
    removeFromQueue: (id: string) => void;
    clearQueue: () => void;
    reorderQueue: (from: number, to: number) => void;
    seekTo: (t: number) => void;
    setVolume: (v: number) => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
    setEqPreset: (preset: EQPreset) => void;
    setShowLyricsDrawer: (show: boolean | ((v: boolean) => boolean)) => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function useAudio() {
    const ctx = useContext(AudioCtx);
    if (!ctx) throw new Error('useAudio must be used inside AudioProvider');
    return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const webAudioCtxRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const bassFilterRef = useRef<BiquadFilterNode | null>(null);
    const midFilterRef = useRef<BiquadFilterNode | null>(null);
    const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [queue, setQueue] = useState<Track[]>([]);
    const [history, setHistory] = useState<Track[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.8);
    const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
    const [shuffle, setShuffle] = useState(false);
    const [eqPreset, setEqPresetState] = useState<EQPreset>('Flat');
    const [showLyricsDrawer, setShowLyricsDrawer] = useState(false);
    const [loadingStream, setLoadingStream] = useState(false);

    // Initialize Web Audio API Nodes
    const initWebAudio = useCallback(() => {
        if (webAudioCtxRef.current) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            webAudioCtxRef.current = ctx;

            const audio = audioRef.current;
            audio.crossOrigin = 'anonymous';

            const source = ctx.createMediaElementSource(audio);
            sourceNodeRef.current = source;

            // Biquad EQ filters
            const bass = ctx.createBiquadFilter();
            bass.type = 'lowshelf';
            bass.frequency.value = 250;

            const mid = ctx.createBiquadFilter();
            mid.type = 'peaking';
            mid.frequency.value = 1500;
            mid.Q.value = 1;

            const treble = ctx.createBiquadFilter();
            treble.type = 'highshelf';
            treble.frequency.value = 4000;

            bassFilterRef.current = bass;
            midFilterRef.current = mid;
            trebleFilterRef.current = treble;

            // Analyser for visualizer
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserNodeRef.current = analyser;

            // Connect chain: source -> bass -> mid -> treble -> analyser -> destination
            source.connect(bass);
            bass.connect(mid);
            mid.connect(treble);
            treble.connect(analyser);
            analyser.connect(ctx.destination);
        } catch { }
    }, []);

    // Equalizer Presets
    const setEqPreset = useCallback((preset: EQPreset) => {
        setEqPresetState(preset);
        if (!bassFilterRef.current || !midFilterRef.current || !trebleFilterRef.current) return;
        switch (preset) {
            case 'Bass Boost':
                bassFilterRef.current.gain.value = 8;
                midFilterRef.current.gain.value = 0;
                trebleFilterRef.current.gain.value = -2;
                break;
            case 'Vocal':
                bassFilterRef.current.gain.value = -3;
                midFilterRef.current.gain.value = 6;
                trebleFilterRef.current.gain.value = 2;
                break;
            case 'Treble Boost':
                bassFilterRef.current.gain.value = -4;
                midFilterRef.current.gain.value = 1;
                trebleFilterRef.current.gain.value = 9;
                break;
            case 'Electronic':
                bassFilterRef.current.gain.value = 6;
                midFilterRef.current.gain.value = 1;
                trebleFilterRef.current.gain.value = 5;
                break;
            case 'Flat':
            default:
                bassFilterRef.current.gain.value = 0;
                midFilterRef.current.gain.value = 0;
                trebleFilterRef.current.gain.value = 0;
                break;
        }
    }, []);

    // ── MEDIA SESSION API FOR BACKGROUND & LOCK SCREEN PLAYBACK ──
    const updateMediaSessionMetadata = useCallback((track: Track) => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || 'Aura Audio',
            artwork: [
                { src: track.artworkUrl || '/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: track.artworkUrl || '/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }, []);

    const updateMediaSessionPosition = useCallback(() => {
        if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
        const audio = audioRef.current;
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate || 1,
                    position: audio.currentTime || 0
                });
            } catch { }
        }
    }, []);

    // Sync HTML audio element events
    useEffect(() => {
        const audio = audioRef.current;
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            updateMediaSessionPosition();
        };
        const onDurationChange = () => {
            setDuration(audio.duration || 0);
            updateMediaSessionPosition();
        };
        const onEnded = () => handleEnded();
        const onPlay = () => {
            setIsPlaying(true);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        };
        const onPause = () => {
            setIsPlaying(false);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('durationchange', onDurationChange);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.volume = volume;

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('durationchange', onDurationChange);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [updateMediaSessionPosition]);

    // Setup MediaSession Action Handlers for Background & Hardware Key Controls
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.setActionHandler('play', () => {
            audioRef.current.play().catch(() => { });
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audioRef.current.pause();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
                audioRef.current.currentTime = details.seekTime;
            }
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - (details.seekOffset || 10), 0);
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + (details.seekOffset || 10), audioRef.current.duration || 0);
        });

        return () => {
            try {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('seekto', null);
                navigator.mediaSession.setActionHandler('seekbackward', null);
                navigator.mediaSession.setActionHandler('seekforward', null);
            } catch { }
        };
    }, []);

    // Load and stream track (resolves YouTube stream if needed)
    const loadAndPlay = useCallback(async (track: Track) => {
        initWebAudio();
        if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'suspended') {
            webAudioCtxRef.current.resume();
        }

        const audio = audioRef.current;
        setCurrentTrack(track);
        updateMediaSessionMetadata(track);

        let playableUrl = track.previewUrl || track.downloadUrl;

        // If it's a YouTube track and stream URL hasn't been resolved yet
        if (track.isYouTube && track.youtubeId && !playableUrl) {
            setLoadingStream(true);
            playableUrl = await youtubeAudioApi.getAudioStreamUrl(track.youtubeId);
            setLoadingStream(false);
        }

        if (playableUrl) {
            audio.src = playableUrl;
            audio.play().catch(() => { });
            setIsPlaying(true);
        }
    }, [initWebAudio, updateMediaSessionMetadata]);

    const playTrack = useCallback((track: Track) => {
        setHistory(h => currentTrack ? [currentTrack, ...h.slice(0, 49)] : h);
        loadAndPlay(track);
    }, [currentTrack, loadAndPlay]);

    const playNow = useCallback((track: Track) => {
        playTrack(track);
    }, [playTrack]);

    const addToQueue = useCallback((track: Track) => {
        setQueue(q => [...q, track]);
    }, []);

    const playNextInQueue = useCallback((track: Track) => {
        setQueue(q => [track, ...q]);
    }, []);

    const removeFromQueue = useCallback((id: string) => {
        setQueue(q => q.filter(t => t.id !== id));
    }, []);

    const clearQueue = useCallback(() => setQueue([]), []);

    const reorderQueue = useCallback((from: number, to: number) => {
        setQueue(q => {
            const next = [...q];
            const [removed] = next.splice(from, 1);
            next.splice(to, 0, removed);
            return next;
        });
    }, []);

    const playNext = useCallback(() => {
        if (queue.length > 0) {
            const [next, ...rest] = shuffle
                ? (() => {
                    const idx = Math.floor(Math.random() * queue.length);
                    const arr = [...queue];
                    const [item] = arr.splice(idx, 1);
                    return [item, ...arr];
                })()
                : queue;
            setHistory(h => currentTrack ? [currentTrack, ...h.slice(0, 49)] : h);
            setQueue(rest);
            loadAndPlay(next);
        } else if (repeat === 'all' && currentTrack) {
            loadAndPlay(currentTrack);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [queue, currentTrack, shuffle, repeat, loadAndPlay]);

    // Update MediaSession previous / next action handlers with latest state
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    }, [playNext]);

    const handleEnded = useCallback(() => {
        if (repeat === 'one' && currentTrack) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        } else {
            playNext();
        }
    }, [repeat, currentTrack, playNext]);

    const playPrev = useCallback(() => {
        if (audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        if (history.length > 0) {
            const [prev, ...rest] = history;
            setHistory(rest);
            if (currentTrack) setQueue(q => [currentTrack, ...q]);
            loadAndPlay(prev);
        }
    }, [history, currentTrack, loadAndPlay]);

    const togglePlay = useCallback(() => {
        initWebAudio();
        const audio = audioRef.current;
        if (!currentTrack) return;
        if (isPlaying) { audio.pause(); } else { audio.play().catch(() => { }); }
    }, [isPlaying, currentTrack, initWebAudio]);

    const seekTo = useCallback((t: number) => {
        audioRef.current.currentTime = t;
        updateMediaSessionPosition();
    }, [updateMediaSessionPosition]);

    const setVolume = useCallback((v: number) => {
        audioRef.current.volume = v;
        setVolumeState(v);
    }, []);

    const toggleRepeat = useCallback(() => {
        setRepeat(r => r === 'none' ? 'one' : r === 'one' ? 'all' : 'none');
    }, []);

    const toggleShuffle = useCallback(() => setShuffle(s => !s), []);

    return (
        <AudioCtx.Provider value={{
            currentTrack, queue, history, isPlaying, currentTime, duration, volume,
            repeat, shuffle, eqPreset, analyserNode: analyserNodeRef.current,
            showLyricsDrawer, loadingStream, playTrack, playNext, playPrev, togglePlay,
            addToQueue, playNow, playNextInQueue, removeFromQueue, clearQueue,
            reorderQueue, seekTo, setVolume, toggleRepeat, toggleShuffle,
            setEqPreset, setShowLyricsDrawer
        }}>
            {children}
        </AudioCtx.Provider>
    );
}
