import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Bookmark, BookmarkCheck, Star, Youtube, Clock, Tv2, ChevronDown, Check } from 'lucide-react';
import { api, FullDetails, VideoInfo, MediaItem } from './api';
import VideoPlayer from './components/VideoPlayer';
import TrailerModal from './components/TrailerModal';

interface Episode {
    episode_number: number;
    title: string;       // mapped from api EpisodeData.name
    overview: string;
    runtime: number;
    still_path?: string | null;
    air_date?: string;
}

function formatRuntime(mins: number | null) {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StarRow({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                    key={n}
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`Rate ${n}`}
                    style={{ padding: 2 }}
                >
                    <Star size={16} style={{
                        color: (hover || value || 0) >= n ? '#F59E0B' : 'var(--surface-3)',
                        fill: (hover || value || 0) >= n ? '#F59E0B' : 'none',
                        transition: 'color 0.15s, transform 0.15s',
                        transform: (hover || value || 0) >= n ? 'scale(1.15)' : 'scale(1)'
                    }} />
                </button>
            ))}
            {value && <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>{value}/10</span>}
        </div>
    );
}

function Toast({ msg }: { msg: string | null }) {
    if (!msg) return null;
    return (
        <div className="toast" style={{
            background: 'var(--surface-3)', border: '1px solid var(--border-glow)',
            color: 'var(--text)', boxShadow: 'var(--shadow-lg)'
        }}>
            {msg}
        </div>
    );
}

export default function MovieDetailPage() {
    const { id, season: routeSeason, episode: routeEpisode } = useParams<{ id: string; season?: string; episode?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const tmdbId = Number(id);

    // Media type derived from route path
    const mediaType: 'movie' | 'tv' = location.pathname.startsWith('/tv') ? 'tv' : 'movie';

    const [details, setDetails] = useState<FullDetails | null>(null);
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Watchlist & Favorites state with LocalStorage fallback sync
    const [inWatchlist, setInWatchlist] = useState<boolean>(() => {
        const storedList: MediaItem[] = JSON.parse(localStorage.getItem('streamx_watchlist') || '[]');
        return storedList.some(item => item.tmdb_id === tmdbId);
    });
    const [isFavorite, setIsFavorite] = useState<boolean>(() => {
        const storedFavs: MediaItem[] = JSON.parse(localStorage.getItem('streamx_favorites') || '[]');
        return storedFavs.some(item => item.tmdb_id === tmdbId);
    });

    const [userRating, setUserRating] = useState<number | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Player and Trailer Modal states
    const [showPlayer, setShowPlayer] = useState(Boolean(routeSeason && routeEpisode));
    const [activeSeasonNum, setActiveSeasonNum] = useState<number>(routeSeason ? Number(routeSeason) : 1);
    const [activeEpisodeNum, setActiveEpisodeNum] = useState<number>(routeEpisode ? Number(routeEpisode) : 1);
    const [showTrailerModal, setShowTrailerModal] = useState(false);

    // TV Show Seasons and Episodes state
    const [seasonsData, setSeasonsData] = useState<{ season_number: number; episode_count: number; name?: string }[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(routeSeason ? Number(routeSeason) : 1);
    const [episodesList, setEpisodesList] = useState<Episode[]>([]);

    useEffect(() => {
        if (!tmdbId || isNaN(tmdbId)) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.allSettled([
            api.getFullDetails(tmdbId, mediaType),
            api.getVideos(tmdbId, mediaType),
            api.checkFavorite(tmdbId),
            api.checkWatchlist(tmdbId),
            api.getRating(tmdbId),
            mediaType === 'tv' ? api.getTVDetails(tmdbId) : Promise.resolve(null),
        ]).then(([det, vid, fav, wl, rating, tvDetails]) => {
            if (cancelled) return;

            if (det.status === 'fulfilled') {
                setDetails(det.value);
            } else {
                setError('Could not load title details. Please check your connection.');
            }

            if (vid.status === 'fulfilled') setVideoInfo(vid.value);
            if (fav.status === 'fulfilled') setIsFavorite((fav.value as any).is_favorite);
            if (wl.status === 'fulfilled') setInWatchlist((wl.value as any).in_watchlist);
            if (rating.status === 'fulfilled') setUserRating((rating.value as any).rating);

            if (mediaType === 'tv' && tvDetails.status === 'fulfilled' && tvDetails.value?.seasons) {
                const validSeasons = tvDetails.value.seasons.filter((s: any) => s.season_number > 0);
                setSeasonsData(validSeasons);
                if (validSeasons.length > 0 && !routeSeason) {
                    setSelectedSeason(validSeasons[0].season_number);
                }
            } else if (mediaType === 'tv' && det.status === 'fulfilled' && det.value.number_of_seasons) {
                const generatedSeasons = Array.from({ length: det.value.number_of_seasons }, (_, i) => ({
                    season_number: i + 1,
                    episode_count: 10,
                    name: `Season ${i + 1}`
                }));
                setSeasonsData(generatedSeasons);
            }

            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [tmdbId, mediaType, routeSeason]);

    // Automatically trigger player if URL has season & episode params
    useEffect(() => {
        if (routeSeason && routeEpisode) {
            setActiveSeasonNum(Number(routeSeason));
            setActiveEpisodeNum(Number(routeEpisode));
            setShowPlayer(true);
        }
    }, [routeSeason, routeEpisode]);

    // Fetch real episode list from API when selected season changes
    const [episodesLoading, setEpisodesLoading] = useState(false);
    useEffect(() => {
        if (mediaType !== 'tv') return;
        let cancelled = false;
        setEpisodesLoading(true);
        api.getSeasonEpisodes(tmdbId, selectedSeason)
            .then(data => {
                if (cancelled) return;
                const mapped: Episode[] = (data?.episodes || []).map(ep => ({
                    episode_number: ep.episode_number,
                    title: ep.name || `Episode ${ep.episode_number}`,
                    overview: ep.overview || 'No description available for this episode.',
                    runtime: ep.runtime || 45,
                    still_path: ep.still_path ?? null,
                    air_date: ep.air_date,
                }));
                setEpisodesList(mapped);
            })
            .catch(() => {
                if (cancelled) return;
                // Fallback: generate stubs with no copied synopsis
                const count = seasonsData.find(s => s.season_number === selectedSeason)?.episode_count || 10;
                setEpisodesList(Array.from({ length: count }, (_, i) => ({
                    episode_number: i + 1,
                    title: `Episode ${i + 1}`,
                    overview: 'No description available for this episode.',
                    runtime: details?.runtime || 45,
                    still_path: null,
                })));
            })
            .finally(() => { if (!cancelled) setEpisodesLoading(false); });
        return () => { cancelled = true; };
    }, [selectedSeason, mediaType, tmdbId, seasonsData, details?.runtime]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(null), 2500);
    };

    const handleWatchlistToggle = async () => {
        if (!details) return;
        const newItem: MediaItem = {
            tmdb_id: details.tmdb_id,
            type: details.type,
            title: details.title,
            poster: details.poster ?? undefined,
            backdrop: details.backdrop ?? undefined,
            overview: details.overview
        };

        // LocalStorage persistent sync
        const storedWatchlist: MediaItem[] = JSON.parse(localStorage.getItem('streamx_watchlist') || '[]');
        let updatedWatchlist: MediaItem[];
        let newState: boolean;

        if (inWatchlist) {
            updatedWatchlist = storedWatchlist.filter(item => item.tmdb_id !== details.tmdb_id);
            newState = false;
        } else {
            updatedWatchlist = [newItem, ...storedWatchlist.filter(item => item.tmdb_id !== details.tmdb_id)];
            newState = true;
        }

        localStorage.setItem('streamx_watchlist', JSON.stringify(updatedWatchlist));
        setInWatchlist(newState);
        showToast(newState ? '🔖 Added to My List' : 'Removed from My List');

        try {
            await api.toggleWatchlist(newItem);
        } catch { }
    };

    const handleFavoriteToggle = async () => {
        if (!details) return;
        const newItem: MediaItem = {
            tmdb_id: details.tmdb_id,
            type: details.type,
            title: details.title,
            poster: details.poster ?? undefined,
            backdrop: details.backdrop ?? undefined,
        };

        const storedFavs: MediaItem[] = JSON.parse(localStorage.getItem('streamx_favorites') || '[]');
        let updatedFavs: MediaItem[];
        let newState: boolean;

        if (isFavorite) {
            updatedFavs = storedFavs.filter(item => item.tmdb_id !== details.tmdb_id);
            newState = false;
        } else {
            updatedFavs = [newItem, ...storedFavs.filter(item => item.tmdb_id !== details.tmdb_id)];
            newState = true;
        }

        localStorage.setItem('streamx_favorites', JSON.stringify(updatedFavs));
        setIsFavorite(newState);
        showToast(newState ? '❤️ Added to Favorites' : 'Removed from Favorites');

        try {
            await api.toggleFavorite(newItem);
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

    const handlePlayMovie = () => {
        setShowPlayer(true);
    };

    const handlePlayEpisode = (epNum: number) => {
        setActiveSeasonNum(selectedSeason);
        setActiveEpisodeNum(epNum);
        navigate(`/tv/${tmdbId}/season/${selectedSeason}/episode/${epNum}`, { replace: true });
        setShowPlayer(true);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <nav className="navbar">
                    <button className="btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </button>
                    <div className="skeleton" style={{ width: 220, height: 20, borderRadius: 6, marginLeft: 8 }} />
                </nav>
                <div className="skeleton" style={{ height: 500 }} />
                <div style={{ padding: '32px 28px', maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="skeleton" style={{ width: 340, height: 44, borderRadius: 10 }} />
                    <div className="skeleton" style={{ width: 240, height: 20, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 12 }} />
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
                <div style={{ fontSize: 48 }}>⚠️</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Title Not Available</h2>
                <p style={{ color: 'var(--text-2)', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
                    {error || 'Unable to load metadata for this title.'}
                </p>
                <button className="btn btn-ghost btn-lg" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <ArrowLeft size={16} /> Return to Home
                </button>
            </div>
        );
    }

    const playerItem: MediaItem = {
        tmdb_id: details.tmdb_id,
        type: details.type,
        title: details.title,
        poster: details.poster ?? undefined,
        backdrop: details.backdrop ?? undefined,
    };

    // Fullscreen Stream Player View
    if (showPlayer) {
        return (
            <VideoPlayer
                item={playerItem}
                initialSeason={activeSeasonNum}
                initialEpisode={activeEpisodeNum}
                onClose={() => {
                    setShowPlayer(false);
                    if (mediaType === 'tv') navigate(`/tv/${tmdbId}`, { replace: true });
                }}
            />
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

            {/* ── CINEMATIC HERO BANNER ── */}
            <div style={{ position: 'relative', height: 540, overflow: 'hidden', background: 'var(--surface-elevated)' }}>
                {details.backdrop ? (
                    <img
                        src={details.backdrop}
                        alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'var(--surface-2)' }} />
                )}

                {/* Cinematic Gradients */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(11,13,18,0.96) 0%, rgba(11,13,18,0.4) 60%, transparent 100%)',
                    zIndex: 2,
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, var(--bg) 0%, rgba(11,13,18,0.6) 35%, transparent 75%)',
                    zIndex: 2,
                }} />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-ghost btn-sm"
                    style={{
                        position: 'absolute', top: 24, left: 28, zIndex: 10,
                        background: 'rgba(11, 13, 18, 0.7)', backdropFilter: 'blur(12px)',
                        borderColor: 'var(--border-2)', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <ArrowLeft size={15} /> Back
                </button>

                {/* Overlaid Hero Details */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    zIndex: 5, padding: '0 28px 40px',
                    maxWidth: 1040, margin: '0 auto',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span className="badge badge-indigo" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
                            {details.type === 'tv' ? 'TV Series' : 'Movie'}
                        </span>
                        {details.status && (
                            <span style={{
                                padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                background: 'rgba(255,255,255,0.1)', color: 'var(--text-2)',
                                border: '1px solid var(--border)',
                            }}>{details.status}</span>
                        )}
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(28px, 5vw, 52px)',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        color: '#F8FAFC',
                        lineHeight: 1.05,
                        marginBottom: 10,
                        textShadow: '0 4px 24px rgba(0,0,0,0.8)',
                    }}>
                        {details.title}
                    </h1>

                    {details.tagline && (
                        <p style={{ fontSize: 14, color: 'var(--text-2)', fontStyle: 'italic', marginBottom: 16 }}>
                            "{details.tagline}"
                        </p>
                    )}

                    {/* Metadata Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {details.vote_average > 0 && (
                            <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Star size={11} style={{ fill: 'currentColor' }} />
                                {details.vote_average.toFixed(1)}
                            </span>
                        )}
                        {details.release_year && (
                            <span style={{
                                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                                background: 'rgba(255,255,255,0.08)', color: 'var(--text)',
                                border: '1px solid var(--border)',
                            }}>{details.release_year}</span>
                        )}
                        {details.runtime && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                                background: 'rgba(255,255,255,0.08)', color: 'var(--text)',
                                border: '1px solid var(--border)',
                            }}>
                                <Clock size={11} />
                                {formatRuntime(details.runtime)}
                            </span>
                        )}
                        {details.number_of_seasons && (
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                                background: 'rgba(255,255,255,0.08)', color: 'var(--text)',
                                border: '1px solid var(--border)',
                            }}>
                                <Tv2 size={11} />
                                {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                            </span>
                        )}
                        {details.genres.slice(0, 4).map(g => (
                            <span key={g.id} className="genre-pill">{g.name}</span>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {details.type === 'movie' ? (
                            <button
                                onClick={handlePlayMovie}
                                className="btn btn-accent btn-lg"
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Play size={18} style={{ fill: 'currentColor' }} />
                                Watch Now
                            </button>
                        ) : (
                            <button
                                onClick={() => handlePlayEpisode(1)}
                                className="btn btn-accent btn-lg"
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Play size={18} style={{ fill: 'currentColor' }} />
                                Play S{selectedSeason}:E1
                            </button>
                        )}

                        {videoInfo?.trailer_key && (
                            <button
                                onClick={() => setShowTrailerModal(true)}
                                className="btn btn-ghost btn-lg"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.1)', color: '#fff',
                                    border: '1px solid var(--border-2)', backdropFilter: 'blur(8px)',
                                }}
                            >
                                <Youtube size={17} style={{ color: '#EF4444' }} /> Watch Trailer
                            </button>
                        )}

                        <button
                            onClick={handleWatchlistToggle}
                            className={`btn btn-lg ${inWatchlist ? 'btn-accent' : 'btn-ghost'}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: inWatchlist ? 'var(--accent-bg)' : 'rgba(255,255,255,0.08)',
                                color: inWatchlist ? 'var(--accent)' : 'var(--text)',
                                border: `1px solid ${inWatchlist ? 'var(--border-glow)' : 'var(--border)'}`
                            }}
                        >
                            {inWatchlist ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                            {inWatchlist ? 'In My List' : 'Add to My List'}
                        </button>

                        <button
                            onClick={handleFavoriteToggle}
                            className={`btn btn-lg ${isFavorite ? 'btn-accent' : 'btn-ghost'}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: isFavorite ? 'var(--accent-bg)' : 'rgba(255,255,255,0.08)',
                                color: isFavorite ? 'var(--accent)' : 'var(--text)',
                                border: `1px solid ${isFavorite ? 'var(--border-glow)' : 'var(--border)'}`
                            }}
                        >
                            <Heart size={17} style={{ fill: isFavorite ? 'currentColor' : 'none' }} />
                            {isFavorite ? 'Favorited' : 'Favorite'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── BODY CONTENT ── */}
            <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 28px 80px' }}>

                {/* Synopsis and Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 44 }}>
                    <div>
                        <p className="section-label" style={{ marginBottom: 12 }}>Synopsis</p>
                        <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--text-2)' }}>
                            {details.overview || 'No synopsis available.'}
                        </p>
                        <div style={{ marginTop: 32 }}>
                            <p className="section-label" style={{ marginBottom: 12 }}>Rate This Title</p>
                            <StarRow value={userRating} onChange={handleRate} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--surface)', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        {details.vote_average > 0 && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 6 }}>Rating Score</p>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Star size={15} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                                    {details.vote_average.toFixed(1)}
                                    <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 500 }}>
                                        ({details.vote_count?.toLocaleString()} votes)
                                    </span>
                                </div>
                            </div>
                        )}

                        {details.release_date && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 6 }}>Release Date</p>
                                <p style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>{details.release_date}</p>
                            </div>
                        )}

                        {details.genres.length > 0 && (
                            <div>
                                <p className="section-label" style={{ marginBottom: 8 }}>Genres</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {details.genres.map(g => <span key={g.id} className="genre-pill">{g.name}</span>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TV SHOW EPISODE SELECTOR COMPONENT ── */}
                {mediaType === 'tv' && (
                    <div style={{ marginTop: 44 }}>
                        <hr className="divider" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                                    Episodes
                                </h2>
                                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                                    Select an episode to start watching instantly
                                </p>
                            </div>

                            {/* Sleek Season Selector Dropdown */}
                            {seasonsData.length > 0 && (
                                <div style={{ position: 'relative', minWidth: 180 }}>
                                    <select
                                        value={selectedSeason}
                                        onChange={e => setSelectedSeason(Number(e.target.value))}
                                        style={{
                                            width: '100%', padding: '10px 36px 10px 16px',
                                            background: 'rgba(24, 27, 34, 0.9)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid var(--border-glow)',
                                            borderRadius: 'var(--radius-lg)',
                                            color: 'var(--text)', fontFamily: 'inherit',
                                            fontSize: 14, fontWeight: 700, outline: 'none',
                                            cursor: 'pointer', appearance: 'none'
                                        }}
                                    >
                                        {seasonsData.map(s => (
                                            <option key={s.season_number} value={s.season_number} style={{ background: '#181B22', color: '#fff' }}>
                                                {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} style={{
                                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--accent)', pointerEvents: 'none'
                                    }} />
                                </div>
                            )}
                        </div>

                        {/* Episode Row Cards List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {episodesLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
                                ))
                            ) : episodesList.map(ep => {
                                const isActive = activeSeasonNum === selectedSeason && activeEpisodeNum === ep.episode_number;
                                return (
                                    <div
                                        key={ep.episode_number}
                                        onClick={() => handlePlayEpisode(ep.episode_number)}
                                        style={{
                                            display: 'flex', gap: 18, padding: 14,
                                            borderRadius: 'var(--radius-lg)',
                                            background: isActive ? 'var(--accent-bg)' : 'var(--surface)',
                                            border: `1px solid ${isActive ? 'var(--border-glow)' : 'var(--border)'}`,
                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                            boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.15)' : 'none'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) e.currentTarget.style.background = 'var(--surface)';
                                        }}
                                    >
                                        {/* 16:9 Thumbnail Preview (160x90px) */}
                                        <div style={{
                                            position: 'relative', width: 160, height: 90, flexShrink: 0,
                                            borderRadius: 'var(--radius)', overflow: 'hidden',
                                            background: 'var(--surface-3)'
                                        }}>
                                            {ep.still_path ? (
                                                <img src={ep.still_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                                                    <Play size={24} />
                                                </div>
                                            )}

                                            {/* Hover / Active Play Button Overlay */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'opacity 0.2s'
                                            }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    background: 'var(--accent)', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.6)'
                                                }}>
                                                    <Play size={16} style={{ fill: '#fff', marginLeft: 2 }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Episode Details */}
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                                <h3 style={{
                                                    fontSize: 15, fontWeight: 800, color: isActive ? 'var(--accent)' : 'var(--text)',
                                                    lineHeight: 1.2
                                                }}>
                                                    {ep.episode_number}. {ep.title}
                                                </h3>
                                                {ep.runtime && (
                                                    <span className="badge badge-grey" style={{ fontSize: 10 }}>
                                                        {ep.runtime}m
                                                    </span>
                                                )}
                                            </div>

                                            <p className="line-clamp-3" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 4 }}>
                                                {ep.overview}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Cast Section */}
                {details.cast && details.cast.length > 0 && (
                    <>
                        <hr className="divider" />
                        <p className="section-label" style={{ marginBottom: 16 }}>Cast</p>
                        <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }} className="scrollbar-hide">
                            {details.cast.map(m => (
                                <div key={m.id} className="cast-card">
                                    {m.profile_path ? (
                                        <img src={m.profile_path} alt={m.name} />
                                    ) : (
                                        <div className="cast-placeholder">👤</div>
                                    )}
                                    <div className="cast-name">{m.name}</div>
                                    <div className="cast-char">{m.character}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Trailer Floating Modal */}
            {showTrailerModal && videoInfo?.trailer_key && (
                <TrailerModal
                    trailerKey={videoInfo.trailer_key}
                    title={`${details.title} — Official Trailer`}
                    onClose={() => setShowTrailerModal(false)}
                />
            )}

            <Toast msg={toastMsg} />
        </div>
    );
}
