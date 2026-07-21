import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Film, Tv, Bookmark, Clock } from 'lucide-react';
import { api, MediaItem } from './api';
import Navbar from './components/Navbar';
import Row from './components/Row';
import MediaCard from './components/Poster';
import { RowSkeleton } from './components/Skeleton';
import HeroBanner from './components/HeroBanner';

interface HomeProps {
    defaultTab?: 'home' | 'movies' | 'tv' | 'list';
}

type Tab = 'home' | 'movies' | 'tv' | 'list';

const TABS: { id: Tab; label: string; route: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'All', route: '/', icon: <TrendingUp size={14} /> },
    { id: 'movies', label: 'Movies', route: '/movies', icon: <Film size={14} /> },
    { id: 'tv', label: 'TV Shows', route: '/tv', icon: <Tv size={14} /> },
    { id: 'list', label: 'My List', route: '/my-list', icon: <Bookmark size={14} /> },
];

export default function Home({ defaultTab = 'home' }: HomeProps) {
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>(defaultTab);

    // Sync tab when prop changes
    useEffect(() => {
        setTab(defaultTab);
    }, [defaultTab]);

    // Data state
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [movies, setMovies] = useState<MediaItem[]>([]);
    const [tv, setTv] = useState<MediaItem[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const [myList, setMyList] = useState<MediaItem[]>([]);
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        // Fetch API + sync LocalStorage Watchlist
        Promise.allSettled([
            api.getTrending(),
            api.getDiscover('movie'),
            api.getDiscover('tv'),
            api.getContinueWatching(),
            api.getWatchlist(),
            api.getRecommendations()
        ]).then(([t, m, tvRes, cw, fav, rec]) => {
            if (cancelled) return;
            if (t.status === 'fulfilled') setTrending(t.value.slice(0, 20));
            if (m.status === 'fulfilled') setMovies(m.value.slice(0, 20));
            if (tvRes.status === 'fulfilled') setTv(tvRes.value.slice(0, 20));
            if (cw.status === 'fulfilled') setContinueWatching(cw.value.slice(0, 10));

            let listItems: MediaItem[] = fav.status === 'fulfilled' && Array.isArray(fav.value) ? fav.value : [];
            const localWl: MediaItem[] = JSON.parse(localStorage.getItem('streamx_watchlist') || '[]');
            if (localWl.length > 0) listItems = localWl;

            setMyList(listItems);
            if (rec.status === 'fulfilled') setRecommendations(rec.value.slice(0, 20));
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    const handleTabClick = (target: typeof TABS[0]) => {
        setTab(target.id);
        navigate(target.route);
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />

            {/* Hero Banner only on Home */}
            {tab === 'home' && trending.length > 0 && !loading && (
                <div style={{ marginTop: 0 }}>
                    <HeroBanner items={trending.slice(0, 5)} />
                </div>
            )}

            {/* Greeting header (if no hero or not home tab) */}
            {(tab !== 'home' || trending.length === 0) && (
                <div className="home-header">
                    <div>
                        <h1 className="home-greeting">{greeting} 👋</h1>
                        <p className="home-sub">What are you watching today?</p>
                    </div>
                </div>
            )}

            {/* Category tabs */}
            <div className="category-tabs scrollbar-hide">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleTabClick(t)}
                        className={`category-tab ${tab === t.id ? 'active' : ''}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div>
                    <RowSkeleton portrait={true} />
                    <RowSkeleton portrait={false} />
                    <RowSkeleton portrait={true} />
                </div>
            ) : (
                <>
                    {/* Continue Watching */}
                    {(tab === 'home' || tab === 'list') && continueWatching.length > 0 && (
                        <div className="home-section">
                            <div className="home-section-header">
                                <h2 className="home-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Clock size={16} style={{ color: 'var(--accent)' }} />
                                    Continue Watching
                                </h2>
                            </div>
                            <div className="section-row scrollbar-hide">
                                {continueWatching.map(item => (
                                    <MediaCard key={`cw-${item.tmdb_id}`} item={item} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Home tab — all sections */}
                    {tab === 'home' && (
                        <>
                            {recommendations.length > 0 && <Row title="Recommended for You" items={recommendations} />}
                            <Row title="Trending Now" items={trending} />
                            <Row title="Popular Movies" items={movies} />
                            <Row title="Top TV Series" items={tv} />
                        </>
                    )}

                    {/* Movies tab */}
                    {tab === 'movies' && (
                        <>
                            <Row title="Popular Movies" items={movies} />
                            <Row
                                title="Trending Movies"
                                items={trending.filter(i => i.type === 'movie')}
                            />
                        </>
                    )}

                    {/* TV tab */}
                    {tab === 'tv' && (
                        <>
                            <Row title="Top TV Series" items={tv} />
                            <Row
                                title="Trending Series"
                                items={trending.filter(i => i.type === 'tv')}
                            />
                        </>
                    )}

                    {/* My List tab */}
                    {tab === 'list' && (
                        myList.length === 0 ? (
                            <div className="empty-state" style={{ paddingTop: 80 }}>
                                <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                                <div className="empty-state-text" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                                    Your Watchlist is Empty
                                </div>
                                <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 6 }}>
                                    Add movies and TV shows you want to watch to find them here easily.
                                </p>
                            </div>
                        ) : (
                            <div className="home-section">
                                <div className="home-section-header">
                                    <h2 className="home-section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <Bookmark size={16} style={{ color: 'var(--accent)' }} />
                                        My List ({myList.length})
                                    </h2>
                                </div>
                                <div className="responsive-card-grid">
                                    {myList.map(item => (
                                        <MediaCard key={`ml-${item.tmdb_id}`} item={item} showLabel />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Bottom padding */}
            <div style={{ height: 64 }} />
        </div>
    );
}
