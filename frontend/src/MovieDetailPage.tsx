import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Bookmark, BookmarkCheck, Star, Youtube, Clock, Tv2, Volume2, VolumeX } from 'lucide-react';
import { api, FullDetails, VideoInfo, MediaItem } from './api';
import VideoPlayer from './components/VideoPlayer';

function formatRuntime(mins: number | null) {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StarRow({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button key={n} onClick={() => onChange(n)}
                    onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                    aria-label={`Rate ${n}`}
                >
                    <Star size={15} style={{
                        color: (hover || value || 0) >= n ? '#FFD60A' : 'var(--surface-3)',
                        fill: (hover || value || 0) >= n ? '#FFD60A' : 'none',
                        transition: 'color 0.1s',
                    }} />
                </button>
            ))}
            {value && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: '#FFD60A' }}>{value}/10</span>}
        </div>
    );
}

function Toast({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return <div className="toast">{msg}</div>;
}

export default function MovieDetailPage() {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const location = useLocation();
    const tmdbId = Number(id);

    // ── Derive media type reliably from the route path ────────
    const mediaType: 'movie' | 'tv' = location.pathname.startsWith('/tv/') ? 'tv' : 'movie';

    const [details, setDetails] = useState<FullDetails | null>(null);
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFavorite, setIsFavorite] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [showPlayer, setShowPlayer] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (!tmdbId || isNaN(tmdbId)) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setDetails(null);

        Promise.allSettled([
            api.getFullDetails(tmdbId, mediaType),
            api.getVideos(tmdbId, mediaType),
            api.checkFavorite(tmdbId),
            api.checkWatchlist(tmdbId),
            api.getRating(tmdbId),
        ]).then(([det, vid, fav, wl, rating]) => {
            if (cancelled) return;
            if (det.status === 'fulfilled') {
                setDetails(det.value);
            } else {
                console.error('Details error:', det.reason);
                setError('Could not load details. The TMDB API might be unavailable.');
            }
            if (vid.status === 'fulfilled') setVideoInfo(vid.value);
            if (fav.status === 'fulfilled') setIsFavorite((fav.value as any).is_favorite);
            if (wl.status === 'fulfilled') setInWatchlist((wl.value as any).in_watchlist);
            if (rating.status === 'fulfilled') setUserRating((rating.value as any).rating);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [tmdbId, mediaType]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(null), 2500);
    };

    const handleFavorite = async () => {
        if (!details) return;
        try {
            const res = await api.toggleFavorite({ tmdb_id: details.tmdb_id, type: details.type, title: details.title } as any);
            setIsFavorite(res.status === 'added');
            showToast(res.status === 'added' ? '❤️ Added to Favorites' : 'Removed from Favorites');
        } catch { }
    };

    const handleWatchlist = async () => {
        if (!details) return;
        try {
            const res = await api.toggleWatchlist({ tmdb_id: details.tmdb_id, type: details.type, title: details.title } as any);
            setInWatchlist((res as any).in_watchlist);
            showToast((res as any).in_watchlist ? '🔖 Added to Watchlist' : 'Removed from Watchlist');
        } catch { }
    };

    const handleRate = async (rating: number) => {
        if (!details) return;
        try {
            await api.rateItem(details.tmdb_id, details.type, rating);
            setUserRating(rating);
            showToast(`⭐ Rated ${rating}/10`);
        } catch { }
    };

    // ── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <nav className="navbar">
                    <button className="btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="skeleton" style={{ width: 200, height: 18, borderRadius: 6, marginLeft: 8 }} />
                </nav>
                <div className="skeleton" style={{ height: 480 }} />
                <div style={{ padding: '28px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="skeleton" style={{ width: 300, height: 40, borderRadius: 10 }} />
                    <div className="skeleton" style={{ width: 220, height: 18, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: '100%', height: 100, borderRadius: 10 }} />
                </div>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div style={{
                minHeight: '100vh', background: 'var(--bg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24
            }}>
                <div style={{ fontSize: 40 }}>⚠️</div>
                <p style={{ color: 'var(--text-2)', fontSize: 15, textAlign: 'center', maxWidth: 380 }}>
                    {error || 'Content not found'}
                </p>
                <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={15} /> Go back
                </button>
            </div>
        );
    }

    const trailerSrc = videoInfo?.trailer_key
        ? `https://www.youtube.com/embed/${videoInfo.trailer_key}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`
        : null;

    const playerItem: MediaItem = {
        tmdb_id: details.tmdb_id,
        type: details.type,
        title: details.title,
        poster: details.poster ?? undefined,
        backdrop: details.backdrop ?? undefined,
    };

    // ── Full-screen player ────────────────────────────────────
    if (showPlayer) {
        return <VideoPlayer item={playerItem} onClose={() => setShowPlayer(false)} />;
    }

    // ── Detail page ───────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

            {/* ── HERO — title overlaid inside ── */}
            <div style={{ position: 'relative', height: 520, overflow: 'hidden', background: 'var(--surface)' }}>

                {/* Backdrop image */}
                {showTrailer && trailerSrc ? (
                    <iframe
                        src={trailerSrc}
                        title={videoInfo?.trailer_name || 'Trailer'}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : details.backdrop ? (
                    <img
                        src={details.backdrop}
                        alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-2)' }} />
                )}

                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(12,12,14,0.85) 0%, rgba(12,12,14,0.3) 60%, transparent 100%)',
                    zIndex: 2,
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, var(--bg) 0%, rgba(12,12,14,0.6) 30%, transparent 70%)',
                    zIndex: 2,
                }} />

                {/* Back button — top-left */}
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-ghost btn-sm"
                    style={{
                        position: 'absolute', top: 20, left: 24, zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                        borderColor: 'rgba(255,255,255,0.15)', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <ArrowLeft size={14} /> Back
                </button>

                {/* Trailer close button */}
                {showTrailer && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowTrailer(false)}
                        style={{
                            position: 'absolute', top: 20, right: 24, zIndex: 10,
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                            borderColor: 'rgba(255,255,255,0.15)', color: '#fff',
                        }}
                    >
                        ✕ Close
                    </button>
                )}

                {/* Content overlaid at the bottom-left of hero */}
                {!showTrailer && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        zIndex: 5, padding: '0 28px 32px',
                        maxWidth: 960, margin: '0 auto',
                    }}>
                        {/* Title */}
                        <h1 style={{
                            fontSize: 'clamp(26px, 4vw, 44px)',
                            fontWeight: 900,
                            letterSpacing: '-0.03em',
                            color: '#fff',
                            lineHeight: 1.1,
                            marginBottom: 10,
                            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                        }}>
                            {details.title}
                        </h1>

                        {details.tagline && (
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginBottom: 12 }}>
                                "{details.tagline}"
                            </p>
                        )}

                        {/* Meta badges */}
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                            {details.vote_average > 0 && (
                                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Star size={10} style={{ fill: 'currentColor' }} />
                                    {details.vote_average}
                                </span>
                            )}
                            {details.release_year && (
                                <span style={{
                                    padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>{details.release_year}</span>
                            )}
                            {details.runtime && (
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>
                                    <Clock size={10} />
                                    {formatRuntime(details.runtime)}
                                </span>
                            )}
                            {details.number_of_seasons && (
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>
                                    <Tv2 size={10} />
                                    {details.number_of_seasons} seasons
                                </span>
                            )}
                            {details.status && (
                                <span style={{
                                    padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>{details.status}</span>
                            )}
                            {details.genres.slice(0, 4).map(g => (
                                <span key={g.id} style={{
                                    padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}>{g.name}</span>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button
                                id="watch-now-btn"
                                className="btn btn-green btn-lg"
                                onClick={() => setShowPlayer(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Play size={17} style={{ fill: 'currentColor' }} />
                                Watch Now
                            </button>

                            {trailerSrc && (
                                <button
                                    id="trailer-btn"
                                    onClick={() => setShowTrailer(v => !v)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        padding: '12px 20px', borderRadius: 'var(--radius-lg)',
                                        fontSize: 15, fontWeight: 600,
                                        background: 'rgba(255,255,255,0.12)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(8px)', cursor: 'pointer',
                                    }}
                                >
                                    <Youtube size={16} /> Trailer
                                </button>
                            )}

                            <button
                                id="favorite-btn"
                                onClick={handleFavorite}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '12px 18px', borderRadius: 'var(--radius-lg)',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    background: isFavorite ? 'var(--accent-bg)' : 'rgba(255,255,255,0.08)',
                                    color: isFavorite ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                                    border: `1px solid ${isFavorite ? 'var(--accent-dim)' : 'rgba(255,255,255,0.15)'}`,
                                }}
                            >
                                <Heart size={15} style={{ fill: isFavorite ? 'currentColor' : 'none' }} />
                                {isFavorite ? 'Saved' : 'Favorite'}
                            </button>

                            <button
                                id="watchlist-btn"
                                onClick={handleWatchlist}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '12px 18px', borderRadius: 'var(--radius-lg)',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    background: inWatchlist ? 'var(--accent-bg)' : 'rgba(255,255,255,0.08)',
                                    color: inWatchlist ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                                    border: `1px solid ${inWatchlist ? 'var(--accent-dim)' : 'rgba(255,255,255,0.15)'}`,
                                }}
                            >
                                {inWatchlist ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                                {inWatchlist ? 'In Watchlist' : 'Watchlist'}
                            </button>

                            {/* Mute toggle while trailer plays */}
                            {showTrailer && (
                                <button
                                    onClick={() => setIsMuted(m => !m)}
                                    style={{
                                        padding: '12px', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.1)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                                    }}
                                >
                                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── BODY ── */}
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 40 }}>
                    {/* Left */}
                    <div>
                        <p className="section-label" style={{ marginBottom: 10 }}>Synopsis</p>
                        <p style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--text-2)' }}>
                            {details.overview || 'No synopsis available.'}
                        </p>
                        <div style={{ marginTop: 28 }}>
                            <p className="section-label" style={{ marginBottom: 10 }}>Your Rating</p>
                            <StarRow value={userRating} onChange={handleRate} />
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {details.vote_average > 0 && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 5 }}>TMDB Score</p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Star size={13} style={{ color: '#FFD60A', fill: '#FFD60A' }} />
                                    {details.vote_average}
                                    <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 400 }}>
                                        ({details.vote_count?.toLocaleString()})
                                    </span>
                                </p>
                            </div>
                        )}
                        {details.release_date && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 5 }}>Released</p>
                                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{details.release_date}</p>
                            </div>
                        )}
                        {details.runtime && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 5 }}>Runtime</p>
                                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{formatRuntime(details.runtime)}</p>
                            </div>
                        )}
                        {details.genres.length > 0 && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 8 }}>Genres</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {details.genres.map(g => <span key={g.id} className="genre-pill">{g.name}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cast */}
                {details.cast.length > 0 && (
                    <>
                        <hr className="divider" />
                        <p className="section-label" style={{ marginBottom: 16 }}>Cast</p>
                        <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }} className="scrollbar-hide">
                            {details.cast.map(m => (
                                <div key={m.id} className="cast-card">
                                    {m.profile_path
                                        ? <img src={m.profile_path} alt={m.name} />
                                        : <div className="cast-placeholder">👤</div>
                                    }
                                    <div className="cast-name">{m.name}</div>
                                    <div className="cast-char">{m.character}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <SimilarSection tmdbId={tmdbId} mediaType={mediaType} />
            </div>

            <Toast msg={toastMsg} />
        </div>
    );
}

function SimilarSection({ tmdbId, mediaType }: { tmdbId: number; mediaType: string }) {
    const navigate = useNavigate();
    const [items, setItems] = useState<MediaItem[]>([]);

    useEffect(() => {
        api.getSimilar(tmdbId, mediaType)
            .then(d => setItems(Array.isArray(d) ? d.slice(0, 12) : []))
            .catch(() => { });
    }, [tmdbId, mediaType]);

    if (items.length === 0) return null;

    return (
        <>
            <hr className="divider" />
            <p className="section-label" style={{ marginBottom: 16 }}>More Like This</p>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }} className="scrollbar-hide">
                {items.map(item => (
                    <div key={item.tmdb_id}
                        onClick={() => navigate(`/${item.type}/${item.tmdb_id}`)}
                        style={{ flexShrink: 0, width: 148, cursor: 'pointer' }}
                    >
                        <div style={{
                            borderRadius: 12, overflow: 'hidden',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.transform = 'none';
                                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }}
                        >
                            {item.poster ? (
                                <img src={item.poster} alt={item.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                                    <Play size={24} />
                                </div>
                            )}
                            <div style={{ padding: '7px 9px 9px' }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.title}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
