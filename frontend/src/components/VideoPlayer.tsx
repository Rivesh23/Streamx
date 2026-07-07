import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, SkipForward, Maximize, Minimize, Settings, Play, List } from 'lucide-react';
import { MediaItem, api } from '../api';

// ─────────────────────────────────────────────────────────────
//  Embed Sources — 30+ providers
// ─────────────────────────────────────────────────────────────
interface Source {
    id: string;
    name: string;
    flag: string;
    quality?: string;
    getUrl: (id: number, type: string, s?: number, e?: number) => string;
}

const SOURCES: Source[] = [
    {
        id: 'vidsrc',         name: 'V2',        flag: '🇬🇧', quality: 'HD',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidsrc.to/embed/movie/${id}`
            : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidlink',        name: 'Premium',   flag: '🇺🇸', quality: '4K',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=30d158`
            : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=30d158`,
    },
    {
        id: 'embed4k',        name: '4K',        flag: '🇬🇧', quality: '4K',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://4kmovie.cc/movie/${id}`
            : `https://4kmovie.cc/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidsrc_max',     name: 'Max',       flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidsrc.me/embed/movie?tmdb=${id}`
            : `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`,
    },
    {
        id: 'vidfast',        name: 'Vidfast',   flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidfast.pro/movie/${id}`
            : `https://vidfast.pro/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidpro',         name: 'Vidpro',    flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
            : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    },
    {
        id: 'nxsha',          name: 'Nxsha',     flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://nxsha.com/movie/${id}`
            : `https://nxsha.com/tv/${id}/${s}/${e}`,
    },
    {
        id: 'atlas',          name: 'Atlas',     flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://embed.su/embed/movie/${id}`
            : `https://embed.su/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidsrcnet',      name: 'Vidsrc',    flag: '🇺🇸', quality: 'HD',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidsrc.net/embed/movie?tmdb=${id}`
            : `https://vidsrc.net/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    },
    {
        id: '2embed',         name: '2Embed',    flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://www.2embed.cc/embed/${id}`
            : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
    },
    {
        id: 'cinemaos',       name: 'Cinemaos',  flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://cinemaos-v2.vercel.app/embed/tmdb/movie/${id}`
            : `https://cinemaos-v2.vercel.app/embed/tmdb/tv/${id}/${s}/${e}`,
    },
    {
        id: 'prime',          name: 'Prime',     flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://frembed.pro/api/film.php?id=${id}`
            : `https://frembed.pro/api/serie.php?id=${id}&sa=${s}&epi=${e}`,
    },
    {
        id: 'ridofilm',       name: 'Netflix',   flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://ridoo.vercel.app/movie/${id}`
            : `https://ridoo.vercel.app/tv/${id}/${s}/${e}`,
    },
    {
        id: 'hotstar',        name: 'Hotstar',   flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://player.autoembed.cc/embed/movie/${id}`
            : `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidnest',        name: 'Vidnest',   flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidnest.top/movie/${id}`
            : `https://vidnest.top/tv/${id}/${s}/${e}`,
    },
    {
        id: 'tongo',          name: 'Tongo',     flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://moviesapi.club/movie/${id}`
            : `https://moviesapi.club/tv/${id}-${s}-${e}`,
    },
    {
        id: 'echo',           name: 'Echo',      flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://www.NontonGo.net/embed/movie/${id}`
            : `https://www.NontonGo.net/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'drive',          name: 'Drive',     flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://embed.smashystream.com/playere.php?tmdb=${id}`
            : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
    },
    {
        id: 'hdmovies',       name: 'Hdmovies',  flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://www.hdmovie2.dad/embed/${id}`
            : `https://www.hdmovie2.dad/embed/${id}/${s}/${e}`,
    },
    {
        id: 'nhd',            name: 'NHD',       flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://nhd.cc/movie/${id}`
            : `https://nhd.cc/tv/${id}/${s}/${e}`,
    },
    {
        id: 'asia',           name: 'Asia',      flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://asiaflix.app/embed/movie/${id}`
            : `https://asiaflix.app/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'bravo',          name: 'Bravo',     flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://bravofly.io/embed/movie/${id}`
            : `https://bravofly.io/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'vidking',        name: 'Vidking',   flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vidmoly.to/embed/movie/${id}`
            : `https://vidmoly.to/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'rip',            name: 'Rip',       flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://ridomovies.tv/core/api/films/tmdb/${id}/videos`
            : `https://ridomovies.tv/core/api/episodes/tmdb/${id}-${s}-${e}/videos`,
    },
    {
        id: 'spencer',        name: 'Spencer',   flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://www.embedsito.com/embed/movie/${id}`
            : `https://www.embedsito.com/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'lima',           name: 'Lima',      flag: '🇺🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://limax-embed.vercel.app/movie/${id}`
            : `https://limax-embed.vercel.app/tv/${id}/${s}/${e}`,
    },
    {
        id: 'src111',         name: '111',       flag: '🇬🇧',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://111movies.com/embed/movie/${id}`
            : `https://111movies.com/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'jade',           name: 'Jade',      flag: '🇵🇹',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://embedrise.com/embed/movie/${id}`
            : `https://embedrise.com/embed/tv/${id}/${s}/${e}`,
    },
    {
        id: 'french',         name: 'French',    flag: '🇫🇷',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://frembed.pro/api/film.php?id=${id}&lang=fr`
            : `https://frembed.pro/api/serie.php?id=${id}&sa=${s}&epi=${e}&lang=fr`,
    },
    {
        id: 'spanish',        name: 'Spanish',   flag: '🇪🇸',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://sflix.to/movie/free-${id}.html`
            : `https://sflix.to/tv/free-${id}.html/season-${s}/episode-${e}`,
    },
    {
        id: 'hindi',          name: 'Hindi',     flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://asiaflix.app/embed/movie/${id}?lang=hi`
            : `https://asiaflix.app/embed/tv/${id}/${s}/${e}?lang=hi`,
    },
    {
        id: 'tamil',          name: 'Tamil',     flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://asiaflix.app/embed/movie/${id}?lang=ta`
            : `https://asiaflix.app/embed/tv/${id}/${s}/${e}?lang=ta`,
    },
    {
        id: 'telugu',         name: 'Telugu',    flag: '🇮🇳',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://asiaflix.app/embed/movie/${id}?lang=te`
            : `https://asiaflix.app/embed/tv/${id}/${s}/${e}?lang=te`,
    },
    {
        id: 'arab',           name: 'Arab',      flag: '🇸🇦',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://moviesapi.club/movie/${id}?lang=ar`
            : `https://moviesapi.club/tv/${id}-${s}-${e}?lang=ar`,
    },
    {
        id: 'french2',        name: 'French 2',  flag: '🇫🇷',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://vf.vidsrc.me/embed/movie?tmdb=${id}&lang=fr`
            : `https://vf.vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}&lang=fr`,
    },
    {
        id: 'brazil',         name: 'Brazil',    flag: '🇧🇷',
        getUrl: (id, t, s=1, e=1) => t === 'movie'
            ? `https://moviesapi.club/movie/${id}?lang=pt`
            : `https://moviesapi.club/tv/${id}-${s}-${e}?lang=pt`,
    },
];

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────
interface VideoPlayerProps {
    item: MediaItem;
    onClose: () => void;
}

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
    const [sourceId, setSourceId] = useState('vidsrc');
    const [showSources, setShowSources] = useState(true); // open source picker first
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [seasons, setSeasons] = useState<{ season_number: number; episode_count: number }[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTopBar, setShowTopBar] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef(Date.now());

    const source = SOURCES.find(s => s.id === sourceId) || SOURCES[0];
    const currentUrl = source.getUrl(item.tmdb_id, item.type, season, episode);

    // Load TV seasons
    useEffect(() => {
        if (item.type !== 'tv') return;
        api.getTVDetails(item.tmdb_id).then(data => {
            if (data?.seasons) {
                const filtered = data.seasons.filter((s: any) => s.season_number > 0);
                setSeasons(filtered);
                if (filtered.length > 0) setSeason(filtered[0].season_number);
            }
        }).catch(() => { });
    }, [item.tmdb_id, item.type]);

    // Heartbeat progress tracking
    useEffect(() => {
        if (showSources) return;
        startedAt.current = Date.now();
        api.logWatch(item, 0).catch(() => { });
        heartbeatRef.current = setInterval(() => {
            const elapsed = (Date.now() - startedAt.current) / 1000;
            api.saveProgress(item.tmdb_id, elapsed, false, item.type, item.title).catch(() => { });
        }, 15_000);
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [showSources, item, sourceId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { if (showSources) onClose(); else setShowSources(true); }
            if (e.key === 'f' || e.key === 'F') toggleFullscreen();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showSources]);

    // Auto-hide top bar
    const resetHideTimer = useCallback(() => {
        setShowTopBar(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (!showSources) {
            hideTimer.current = setTimeout(() => setShowTopBar(false), 3000);
        }
    }, [showSources]);

    useEffect(() => {
        window.addEventListener('mousemove', resetHideTimer);
        return () => window.removeEventListener('mousemove', resetHideTimer);
    }, [resetHideTimer]);

    useEffect(() => {
        if (!showSources) resetHideTimer();
        else setShowTopBar(true);
    }, [showSources]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleNextEpisode = () => {
        const s = seasons.find(s => s.season_number === season);
        if (s && episode < s.episode_count) {
            setEpisode(e => e + 1);
        } else {
            const nextSeason = seasons.find(s => s.season_number === season + 1);
            if (nextSeason) { setSeason(season + 1); setEpisode(1); }
        }
    };

    const handlePlaySource = (id: string) => {
        setSourceId(id);
        setShowSources(false);
    };

    // ── Render ──────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="player-overlay"
            onMouseMove={resetHideTimer}
        >
            {/* ── TOP BAR ── */}
            <div className="player-topbar" style={{
                opacity: showTopBar ? 1 : 0,
                transition: 'opacity 0.3s',
                pointerEvents: showTopBar ? 'auto' : 'none',
            }}>
                <button
                    onClick={() => showSources ? onClose() : setShowSources(true)}
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0 }}
                >
                    <ChevronLeft size={16} /> {showSources ? 'Close' : 'Sources'}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                        {item.type === 'tv' && <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginLeft: 8 }}>S{season}:E{episode}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        {source.flag} {source.name} {source.quality ? `· ${source.quality}` : ''}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* TV controls */}
                    {item.type === 'tv' && !showSources && (
                        <div className="tv-controls">
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
                            <button onClick={handleNextEpisode} style={{ color: 'var(--text-2)' }} title="Next episode">
                                <SkipForward size={16} />
                            </button>
                        </div>
                    )}

                    {!showSources && (
                        <button onClick={() => setShowSources(true)} className="btn btn-ghost btn-sm">
                            <List size={14} /> Sources
                        </button>
                    )}

                    <button onClick={toggleFullscreen} className="btn-icon" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>

                    <button onClick={onClose} className="btn-icon" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* ── SOURCE PICKER ── */}
            {showSources && (
                <div className="source-panel" style={{ paddingTop: 70 }}>
                    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
                        {/* Title */}
                        <div style={{ marginBottom: 6 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                                Choose a Source
                            </h2>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                Select a streaming server to watch <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{item.title}</strong>
                            </p>
                        </div>

                        {/* TV season/episode */}
                        {item.type === 'tv' && seasons.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 20, marginTop: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Season</label>
                                    <select
                                        value={season}
                                        onChange={e => { setSeason(Number(e.target.value)); setEpisode(1); }}
                                        style={{
                                            width: '100%', padding: '9px 12px',
                                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)', color: '#fff',
                                            fontFamily: 'inherit', fontSize: 14, outline: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        {seasons.map(s => (
                                            <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Episode</label>
                                    <select
                                        value={episode}
                                        onChange={e => setEpisode(Number(e.target.value))}
                                        style={{
                                            width: '100%', padding: '9px 12px',
                                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)', color: '#fff',
                                            fontFamily: 'inherit', fontSize: 14, outline: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        {Array.from({ length: seasons.find(s => s.season_number === season)?.episode_count || 1 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Source grid */}
                        <div className="source-grid">
                            {SOURCES.map(src => (
                                <button
                                    key={src.id}
                                    onClick={() => handlePlaySource(src.id)}
                                    className={`source-btn ${sourceId === src.id ? 'active' : ''}`}
                                    style={{ position: 'relative' }}
                                >
                                    {src.quality && (
                                        <span className="source-quality">{src.quality}</span>
                                    )}
                                    <span className="source-flag">{src.flag}</span>
                                    <span>{src.name}</span>
                                </button>
                            ))}
                        </div>

                        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                            If one source doesn't work, try another. Some may be region-locked.
                        </p>
                    </div>
                </div>
            )}

            {/* ── PLAYER ── */}
            {!showSources && (
                <div className="player-iframe-wrap" style={{ paddingTop: 56 }}>
                    {item.is_local ? (
                        <video
                            src={`/api/stream/${item.tmdb_id}`}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
                            autoPlay
                            controls
                        />
                    ) : (
                        <iframe
                            ref={iframeRef}
                            key={`${sourceId}-${season}-${episode}`}
                            src={currentUrl}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            referrerPolicy="origin"
                            title={`${item.title} — ${source.name}`}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
