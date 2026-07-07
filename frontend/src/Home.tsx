import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, TrendingUp, Film, Tv, Bookmark, Clock, X } from 'lucide-react';
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

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'All', icon: <TrendingUp size={14} /> },
    { id: 'movies', label: 'Movies', icon: <Film size={14} /> },
    { id: 'tv', label: 'TV Shows', icon: <Tv size={14} /> },
    { id: 'list', label: 'My List', icon: <Bookmark size={14} /> },
];

export default function Home({ defaultTab = 'home' }: HomeProps) {
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>(defaultTab);
    const [searchQuery, setSearchQuery] = useState('');

    // Data state
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [movies, setMovies] = useState<MediaItem[]>([]);
    const [tv, setTv] = useState<MediaItem[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const [myList, setMyList] = useState<MediaItem[]>([]);
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);

    const [loading, setLoading] = useState(true);

    // ── Load data ───────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.allSettled([
            api.getTrending(),
            api.getDiscover('movie'),
            api.getDiscover('tv'),
            api.getLibrary(), // using getLibrary as placeholder for continue watching if needed
            api.getFavorites(),
            api.getRecommendations()
        ]).then(([t, m, tv, cw, fav, rec]) => {
            if (cancelled) return;
            if (t.status === 'fulfilled') setTrending(t.value.slice(0, 20));
            if (m.status === 'fulfilled') setMovies(m.value.slice(0, 20));
            if (tv.status === 'fulfilled') setTv(tv.value.slice(0, 20));
            if (cw.status === 'fulfilled') setContinueWatching(cw.value.slice(0, 10));
            if (fav.status === 'fulfilled') setMyList(fav.value.slice(0, 20));
            if (rec.status === 'fulfilled') setRecommendations(rec.value.slice(0, 20));
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // ── Main view ───────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            {/* Hero Banner only on Home */}
            {tab === 'home' && trending.length > 0 && !loading && (
                <div style={{ marginTop: -20 }}>
                    <HeroBanner items={trending.slice(0, 5)} />
                </div>
            )}

            {/* Greeting header (if no hero) */}
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
                        onClick={() => setTab(t.id)}
                        className={`category-tab ${tab === t.id ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
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
                                    <Clock size={16} style={{ color: 'var(--accent-dark)' }} />
                                    Continue Watching
                                </h2>
                            </div>
                            <div className="section-row scrollbar-hide">
                                {continueWatching.map(item => (
                                    <MediaCard key={item.tmdb_id} item={item} />
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
                            <Row title="Top TV Shows" items={tv} />
                        </>
                    )}

                    {/* Movies tab */}
                    {tab === 'movies' && (
                        <>
                            <Row title="Popular Movies" items={movies} />
                            <Row
                                title="Trending"
                                items={trending.filter(i => i.type === 'movie')}
                            />
                        </>
                    )}

                    {/* TV tab */}
                    {tab === 'tv' && (
                        <>
                            <Row title="Top TV Shows" items={tv} />
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
                                <div className="empty-state-icon">🎬</div>
                                <div className="empty-state-text">Your list is empty</div>
                                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
                                    Add movies & shows you want to watch
                                </p>
                            </div>
                        ) : (
                            <Row title="My List" items={myList} />
                        )
                    )}
                </>
            )}

            {/* Bottom padding */}
            <div style={{ height: 64 }} />
        </div>
    );
}
