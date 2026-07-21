import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Pause, Plus, Music2, X, List, Clock, Loader2, Sparkles, Youtube, Disc3 } from 'lucide-react';
import { useAudio, Track } from './AudioContext';
import { audioApi } from './services/audioApi';
import { youtubeAudioApi } from './services/youtubeAudioApi';
import Navbar from './components/Navbar';

function fmtDuration(ms: number) {
    if (!ms) return '--';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

type AudioSourceFilter = 'all' | 'youtube' | 'saavn';

function TrackRow({
    track,
    isActive,
    isPlaying,
    onPlay,
    onAddQueue,
    onPlayNext,
    showQueue = true,
}: {
    track: Track;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onAddQueue: () => void;
    onPlayNext: () => void;
    showQueue?: boolean;
}) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                borderRadius: 12, background: isActive ? 'rgba(99,102,241,0.12)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                transition: 'all 0.18s ease', cursor: 'pointer'
            }}
        >
            {/* Artwork */}
            <div onClick={onPlay} style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-3)' }}>
                {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music2 size={20} style={{ color: 'var(--text-3)' }} />
                    </div>
                )}
                {(hovered || isActive) && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isActive && isPlaying
                            ? <Pause size={18} style={{ color: '#fff', fill: '#fff' }} />
                            : <Play size={18} style={{ color: '#fff', fill: '#fff' }} />
                        }
                    </div>
                )}
            </div>

            {/* Title & Artist */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div onClick={onPlay} style={{ fontSize: 14, fontWeight: 800, color: isActive ? 'var(--accent)' : '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {track.artistId ? (
                        <span
                            onClick={e => { e.stopPropagation(); navigate(`/audio/artist/${track.artistId}`); }}
                            style={{ color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {track.artist}
                        </span>
                    ) : (
                        <span>{track.artist}</span>
                    )}
                    {track.album && <span> · {track.album}</span>}
                </div>
            </div>

            {/* Source Badge */}
            {track.isYouTube ? (
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Youtube size={10} /> YouTube
                </span>
            ) : (
                <span className="badge badge-indigo" style={{ fontSize: 9, padding: '2px 7px', flexShrink: 0 }}>320kbps</span>
            )}

            {/* Duration */}
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {fmtDuration(track.durationMs)}
            </div>

            {/* Actions (Hover) */}
            {(hovered || isActive) && showQueue && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                        onClick={e => { e.stopPropagation(); onPlayNext(); }}
                        title="Play Next"
                        style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Next
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onAddQueue(); }}
                        title="Add to Queue"
                        style={{ padding: 5, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AudioPage() {
    const [query, setQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<AudioSourceFilter>('all');
    const [results, setResults] = useState<Track[]>([]);
    const [searching, setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'history'>('search');

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        currentTrack, isPlaying, queue, history,
        playTrack, addToQueue, playNextInQueue, removeFromQueue, clearQueue
    } = useAudio();

    const doSearch = useCallback(async (q: string, filter: AudioSourceFilter) => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);

        try {
            if (filter === 'youtube') {
                const ytTracks = await youtubeAudioApi.searchYouTube(q);
                setResults(ytTracks);
            } else if (filter === 'saavn') {
                const saavnTracks = await audioApi.searchSongs(q);
                setResults(saavnTracks);
            } else {
                const [saavnRes, ytRes] = await Promise.allSettled([
                    audioApi.searchSongs(q),
                    youtubeAudioApi.searchYouTube(q),
                ]);
                const saavn = saavnRes.status === 'fulfilled' ? saavnRes.value : [];
                const yt = ytRes.status === 'fulfilled' ? ytRes.value : [];

                // Interleave results for rich discovery
                const combined: Track[] = [];
                const maxLen = Math.max(saavn.length, yt.length);
                for (let i = 0; i < maxLen; i++) {
                    if (saavn[i]) combined.push(saavn[i]);
                    if (yt[i]) combined.push(yt[i]);
                }
                setResults(combined);
            }
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => doSearch(query, sourceFilter), 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [query, sourceFilter, doSearch]);

    // Initial trending query
    useEffect(() => {
        doSearch('global top hits 2024', 'all');
    }, [doSearch]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 100 }}>
            <Navbar />

            {/* Header */}
            <div style={{
                padding: '36px 32px 24px',
                background: 'linear-gradient(to bottom, rgba(99,102,241,0.08) 0%, transparent 100%)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ maxWidth: 940, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.45)' }}>
                            <Sparkles size={22} style={{ color: '#fff' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>Aura Audio Pro</h1>
                            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>YouTube Audio + 320kbps Lossless · Background & Lock Screen Playback · Synced Lyrics</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginTop: 20 }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search YouTube or Lossless songs, artists, covers, OSTs..."
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '14px 48px 14px 48px',
                                background: 'rgba(24,27,34,0.9)', backdropFilter: 'blur(12px)',
                                border: '1px solid var(--border-glow)', borderRadius: 16,
                                color: 'var(--text)', fontSize: 15, outline: 'none',
                                fontFamily: 'inherit', transition: 'all 0.2s ease',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {searching && <Loader2 size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />}
                        {!searching && query && (
                            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Source Selector Filter Pills */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        {[
                            { id: 'all', label: '🔥 All Sources' },
                            { id: 'youtube', label: '🎬 YouTube Audio' },
                            { id: 'saavn', label: '🎧 Lossless 320kbps' },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSourceFilter(f.id as AudioSourceFilter)}
                                style={{
                                    padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 700,
                                    background: sourceFilter === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                    color: sourceFilter === f.id ? '#fff' : 'var(--text-2)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs + Content */}
            <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 32px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--surface)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
                    {(['search', 'queue', 'history'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                                background: activeTab === tab ? 'var(--accent)' : 'transparent',
                                color: activeTab === tab ? '#fff' : 'var(--text-3)',
                                transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                            {tab === 'search' && <Search size={13} />}
                            {tab === 'queue' && <List size={13} />}
                            {tab === 'history' && <Clock size={13} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'queue' && queue.length > 0 && (
                                <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 999, padding: '0 6px', fontSize: 10 }}>{queue.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Tab */}
                {activeTab === 'search' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {results.length === 0 && !searching && (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                                <Music2 size={42} style={{ opacity: 0.3, marginBottom: 12 }} />
                                <p style={{ fontSize: 15 }}>Search YouTube or Lossless songs</p>
                            </div>
                        )}
                        {results.map(track => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                isActive={currentTrack?.id === track.id}
                                isPlaying={isPlaying && currentTrack?.id === track.id}
                                onPlay={() => playTrack(track)}
                                onAddQueue={() => addToQueue(track)}
                                onPlayNext={() => playNextInQueue(track)}
                            />
                        ))}
                    </div>
                )}

                {/* Queue Tab */}
                {activeTab === 'queue' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>
                                Up Next ({queue.length})
                            </h2>
                            {queue.length > 0 && (
                                <button onClick={clearQueue} style={{ fontSize: 12, color: '#F87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontWeight: 700 }}>
                                    Clear All
                                </button>
                            )}
                        </div>
                        {queue.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                                <List size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                                <p>Queue is empty</p>
                            </div>
                        ) : queue.map((track, i) => (
                            <div key={track.id + i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <TrackRow
                                    track={track}
                                    isActive={false}
                                    isPlaying={false}
                                    onPlay={() => playTrack(track)}
                                    onAddQueue={() => { }}
                                    onPlayNext={() => { }}
                                    showQueue={false}
                                />
                                <button onClick={() => removeFromQueue(track.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginBottom: 16 }}>Recently Played ({history.length})</h2>
                        {history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
                                <Clock size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                                <p>No history yet</p>
                            </div>
                        ) : history.map((track, i) => (
                            <TrackRow
                                key={track.id + i}
                                track={track}
                                isActive={currentTrack?.id === track.id}
                                isPlaying={isPlaying && currentTrack?.id === track.id}
                                onPlay={() => playTrack(track)}
                                onAddQueue={() => addToQueue(track)}
                                onPlayNext={() => playNextInQueue(track)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
