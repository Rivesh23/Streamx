import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, SkipForward, Maximize, Minimize, AlertCircle, RefreshCw, Server, Play, Zap, Film } from 'lucide-react';
import { MediaItem, api } from '../api';

export interface Source {
    id: string;
    name: string;
    badge: string;
    flag: string;
    quality: string;
    qualityBadge: string;
    getUrl: (id: number, type: string, s?: number, e?: number) => string;
}

/** Priority order: VidLink > Embed.su > AutoEmbed > VidSrc.pro > fallbacks */
export const EMBED_SOURCES: Source[] = [
    {
        id: 'vidlink',
        name: 'VidLink',
        badge: '4K Ready',
        flag: '💎',
        quality: '4K',
        qualityBadge: '4K Ready',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://vidlink.pro/movie/${id}?primaryColor=6366f1`
            : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=6366f1`,
    },
    {
        id: 'embedsu',
        name: 'Embed.su',
        badge: '1080p HD',
        flag: '🌟',
        quality: '1080p',
        qualityBadge: '1080p HD',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://embed.su/embed/movie/${id}`
            : `https://embed.su/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'autoembed',
        name: 'AutoEmbed',
        badge: 'Auto-Switch',
        flag: '🚀',
        quality: '1080p',
        qualityBadge: 'Auto-Switch',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://autoembed.co/movie/tmdb/${id}`
            : `https://autoembed.co/tv/tmdb/${id}/${s}/${e}`,
    },
    {
        id: 'vidsrc',
        name: 'VidSrc Pro',
        badge: 'HD',
        flag: '🛡️',
        quality: 'HD',
        qualityBadge: '1080p HD',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://vidsrc.pro/embed/movie/${id}`
            : `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidsrc_me',
        name: 'VidSrc.me',
        badge: 'Direct',
        flag: '🎬',
        quality: 'HD',
        qualityBadge: '1080p HD',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://vidsrc.me/embed/movie?tmdb=${id}`
            : `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`,
    },
    {
        id: 'vidsrc_cc',
        name: 'VidSrc.cc',
        badge: 'Fast',
        flag: '⚡',
        quality: '4K',
        qualityBadge: '4K Ready',
        getUrl: (id, t, s = 1, e = 1) => t === 'movie'
            ? `https://vidsrc.cc/v2/embed/movie/${id}`
            : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    },
];

const AUTO_FAILOVER_MS = 3500;

interface VideoPlayerProps {
    item: MediaItem;
    initialSeason?: number;
    initialEpisode?: number;
    onClose: () => void;
}

export default function VideoPlayer({ item, initialSeason = 1, initialEpisode = 1, onClose }: VideoPlayerProps) {
    const [sourceIndex, setSourceIndex] = useState(0);
    const [showSourcesPanel, setShowSourcesPanel] = useState(false);
    const [season, setSeason] = useState(initialSeason);
    const [episode, setEpisode] = useState(initialEpisode);
    const [seasons, setSeasons] = useState<{ season_number: number; episode_count: number }[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTopBar, setShowTopBar] = useState(true);
    const [isLoadingIframe, setIsLoadingIframe] = useState(true);
    const [failoverToast, setFailoverToast] = useState<string | null>(null);
    const [autoSwitchActive, setAutoSwitchActive] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const failoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAt = useRef(Date.now());

    const activeSource = EMBED_SOURCES[sourceIndex];
    const currentUrl = activeSource.getUrl(item.tmdb_id, item.type, season, episode);

    // Load TV seasons
    useEffect(() => {
        if (item.type !== 'tv') return;
        api.getTVDetails(item.tmdb_id).then(data => {
            if (data?.seasons) {
                setSeasons(data.seasons.filter((s: any) => s.season_number > 0));
            }
        }).catch(() => { });
    }, [item.tmdb_id, item.type]);

    // Auto-failover: if iframe hasn't loaded within 3.5s, switch to next server
    const scheduleFailover = useCallback(() => {
        if (failoverTimer.current) clearTimeout(failoverTimer.current);
        failoverTimer.current = setTimeout(() => {
            setAutoSwitchActive(true);
            setSourceIndex(prev => {
                const next = (prev + 1) % EMBED_SOURCES.length;
                const nextSource = EMBED_SOURCES[next];
                setFailoverToast(`⚡ Auto-switched to ${nextSource.name}`);
                setTimeout(() => { setFailoverToast(null); setAutoSwitchActive(false); }, 3000);
                return next;
            });
        }, AUTO_FAILOVER_MS);
    }, []);

    // Reset loading + failover timer on source/episode change
    useEffect(() => {
        setIsLoadingIframe(true);
        scheduleFailover();
        return () => {
            if (failoverTimer.current) clearTimeout(failoverTimer.current);
        };
    }, [sourceIndex, season, episode, scheduleFailover]);

    // Cancel failover timer when iframe loads successfully
    const handleIframeLoad = useCallback(() => {
        setIsLoadingIframe(false);
        if (failoverTimer.current) clearTimeout(failoverTimer.current);
    }, []);

    // Heartbeat progress logging
    useEffect(() => {
        if (showSourcesPanel) return;
        startedAt.current = Date.now();
        api.logWatch(item, 0).catch(() => { });
        heartbeatRef.current = setInterval(() => {
            const elapsed = (Date.now() - startedAt.current) / 1000;
            api.saveProgress(item.tmdb_id, elapsed, false, item.type, item.title).catch(() => { });
        }, 15_000);
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [showSourcesPanel, item, sourceIndex, season, episode]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showSourcesPanel) setShowSourcesPanel(false);
                else onClose();
            }
            if (e.key === 'f' || e.key === 'F') toggleFullscreen();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showSourcesPanel, onClose]);

    // Auto-hide controls
    const resetHideTimer = useCallback(() => {
        setShowTopBar(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (!showSourcesPanel) {
            hideTimer.current = setTimeout(() => setShowTopBar(false), 3500);
        }
    }, [showSourcesPanel]);

    useEffect(() => {
        window.addEventListener('mousemove', resetHideTimer);
        return () => window.removeEventListener('mousemove', resetHideTimer);
    }, [resetHideTimer]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(() => { });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => { });
            setIsFullscreen(false);
        }
    };

    const handleNextEpisode = () => {
        const currentSeasonObj = seasons.find(s => s.season_number === season);
        if (currentSeasonObj && episode < currentSeasonObj.episode_count) {
            setEpisode(e => e + 1);
        } else {
            const nextSeasonObj = seasons.find(s => s.season_number === season + 1);
            if (nextSeasonObj) { setSeason(season + 1); setEpisode(1); }
        }
    };

    const handleManualSwitch = (idx: number) => {
        setSourceIndex(idx);
        setShowSourcesPanel(false);
        setIsLoadingIframe(true);
    };

    const handleForceNext = () => {
        const next = (sourceIndex + 1) % EMBED_SOURCES.length;
        const nextSource = EMBED_SOURCES[next];
        setSourceIndex(next);
        setFailoverToast(`🔄 Switched to ${nextSource.name}`);
        setTimeout(() => setFailoverToast(null), 2500);
        setIsLoadingIframe(true);
    };

    const qualityLabel = activeSource.qualityBadge;
    const qualityColor = qualityLabel.includes('4K') ? '#A78BFA' : qualityLabel.includes('1080') ? '#6366F1' : '#64748B';

    return (
        <div
            ref={containerRef}
            className="player-overlay"
            onMouseMove={resetHideTimer}
            style={{ background: '#000', userSelect: 'none' }}
        >
            {/* ── TOP CONTROL BAR ── */}
            <div className="player-topbar" style={{
                opacity: showTopBar || showSourcesPanel ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: showTopBar || showSourcesPanel ? 'auto' : 'none',
                background: 'linear-gradient(to bottom, rgba(11, 13, 18, 0.97) 0%, transparent 100%)',
                backdropFilter: 'blur(12px)', padding: '14px 24px'
            }}>
                <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flexShrink: 0, gap: 6 }}>
                    <ChevronLeft size={16} /> Back
                </button>

                <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                        {item.type === 'tv' && (
                            <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 10 }}>
                                S{season} · E{episode}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span>{activeSource.flag} {activeSource.name}</span>
                        {/* Quality Status Bar */}
                        <span style={{
                            padding: '1px 8px', borderRadius: 999, fontSize: 9, fontWeight: 800,
                            background: `${qualityColor}22`, color: qualityColor,
                            border: `1px solid ${qualityColor}66`, letterSpacing: '0.05em'
                        }}>
                            {qualityLabel}
                        </span>
                        {autoSwitchActive && (
                            <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
                                AUTO-SWITCH
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {/* TV Quick Switcher */}
                    {item.type === 'tv' && !showSourcesPanel && (
                        <div className="tv-controls" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border)' }}>
                            <select value={season} onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}>
                                {seasons.map(s => (
                                    <option key={s.season_number} value={s.season_number}>S{s.season_number}</option>
                                ))}
                            </select>
                            <select value={episode} onChange={e => setEpisode(Number(e.target.value))}>
                                {Array.from({ length: seasons.find(s => s.season_number === season)?.episode_count || 1 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>Ep {i + 1}</option>
                                ))}
                            </select>
                            <button onClick={handleNextEpisode} style={{ color: 'var(--text)', display: 'flex', alignItems: 'center' }} title="Next Episode">
                                <SkipForward size={15} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleForceNext}
                        className="btn btn-ghost btn-sm"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Force switch to next server"
                    >
                        <RefreshCw size={13} /> Switch
                    </button>

                    <button
                        onClick={() => setShowSourcesPanel(v => !v)}
                        className={`btn btn-sm ${showSourcesPanel ? 'btn-accent' : 'btn-ghost'}`}
                    >
                        <Server size={14} /> Servers
                    </button>

                    <button onClick={toggleFullscreen} className="btn-icon">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>

                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* ── SERVER SELECTION OVERLAY PANEL ── */}
            {showSourcesPanel && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 100,
                    background: 'rgba(11, 13, 18, 0.97)', backdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '80px 24px 40px', overflowY: 'auto'
                }}>
                    <div style={{ maxWidth: 800, width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                                Select Streaming Server
                            </h2>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>
                                Streaming <strong style={{ color: 'var(--accent)' }}>{item.title}</strong>
                                {item.type === 'tv' && ` — S${season} E${episode}`}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                                Auto-failover kicks in after {AUTO_FAILOVER_MS / 1000}s if a server doesn't respond
                            </p>
                        </div>

                        {/* TV Season/Episode inside panel */}
                        {item.type === 'tv' && seasons.length > 0 && (
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                                marginBottom: 24, padding: 16, background: 'var(--surface-2)',
                                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
                            }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Season</label>
                                    <select value={season} onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                                        {seasons.map(s => (
                                            <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Episode</label>
                                    <select value={episode} onChange={e => setEpisode(Number(e.target.value))}
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                                        {Array.from({ length: seasons.find(s => s.season_number === season)?.episode_count || 1 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Servers Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                            {EMBED_SOURCES.map((src, idx) => {
                                const isActive = sourceIndex === idx;
                                const qColor = src.qualityBadge.includes('4K') ? '#A78BFA' : src.qualityBadge.includes('1080') ? '#6366F1' : '#64748B';
                                return (
                                    <button
                                        key={src.id}
                                        onClick={() => handleManualSwitch(idx)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                            padding: '16px', borderRadius: 'var(--radius-lg)',
                                            background: isActive ? 'var(--accent-bg)' : 'var(--surface-2)',
                                            border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                            boxShadow: isActive ? '0 0 24px rgba(99, 102, 241, 0.3)' : 'none',
                                            cursor: 'pointer', transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
                                            <span style={{ fontSize: 20 }}>{src.flag}</span>
                                            <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: `${qColor}22`, color: qColor, border: `1px solid ${qColor}66` }}>
                                                {src.qualityBadge}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: isActive ? 'var(--accent)' : 'var(--text)' }}>
                                            {src.name}
                                        </div>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontWeight: 600 }}>
                                            {idx === 0 ? 'Primary · Fastest' : idx < 3 ? 'Backup Server' : 'Fallback Router'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <button onClick={() => setShowSourcesPanel(false)} className="btn btn-accent btn-lg" style={{ padding: '12px 32px' }}>
                                Resume Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── IFRAME EMBED PLAYER ── */}
            {!showSourcesPanel && (
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    {isLoadingIframe && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            background: 'var(--bg)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 16
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                border: '3px solid var(--surface-3)', borderTopColor: 'var(--accent)',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>
                                Connecting to {activeSource.name}…
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                Auto-switching in {AUTO_FAILOVER_MS / 1000}s if no response
                            </div>
                        </div>
                    )}

                    {/* Failover toast notification */}
                    {failoverToast && (
                        <div style={{
                            position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                            zIndex: 20, background: 'rgba(99, 102, 241, 0.9)', color: '#fff',
                            padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                            boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Zap size={14} /> {failoverToast}
                        </div>
                    )}

                    <iframe
                        ref={iframeRef}
                        key={`${sourceIndex}-${season}-${episode}`}
                        src={currentUrl}
                        onLoad={handleIframeLoad}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        referrerPolicy="origin"
                        title={`${item.title} — ${activeSource.name}`}
                        style={{
                            position: 'absolute', inset: 0, width: '100%', height: '100%',
                            border: 'none', background: '#000'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
