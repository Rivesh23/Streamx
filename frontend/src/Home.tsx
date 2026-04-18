import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, MediaItem } from './api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Row from './components/Row';
import Poster from './components/Poster';
import MoreInfoModal from './components/MoreInfoModal';
import VideoPlayer from './components/VideoPlayer';
import { HeroSkeleton, RowSkeleton, PosterSkeleton } from './components/Skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX, AlertCircle, ArrowUp, Check, Sparkles } from 'lucide-react';

interface HomeProps {
    category?: 'all' | 'movie' | 'tv' | 'list' | 'favorites';
}

const MOODS = [
    { id: 'sad', label: '😭 Émouvant', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
    { id: 'motivating', label: '🚀 Motivant', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' },
    { id: 'action', label: '⚡ Rapide', color: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' },
    { id: 'mindbending', label: '🧠 Mind-Bending', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' }
];

export default function Home({ category: routeCategory = 'all' }: HomeProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topTV, setTopTV] = useState<MediaItem[]>([]);
    const [library, setLibrary] = useState<MediaItem[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const [favorites, setFavorites] = useState<MediaItem[]>([]);
    const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
    const [history, setHistory] = useState<MediaItem[]>([]);

    const [activeCategory, setActiveCategory] = useState(routeCategory);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
    const [modalItem, setModalItem] = useState<MediaItem | null>(null);
    const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
    const [isWatchPartyMode, setIsWatchPartyMode] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeMood, setActiveMood] = useState<string | null>(null);

    const getMoodResults = () => {
        const pool = [...popular, ...topTV];
        if (!activeMood) return pool;
        
        return pool.filter(item => {
            const txt = (item.overview + " " + item.title).toLowerCase();
            switch (activeMood) {
                case 'sad': return txt.includes('death') || txt.includes('loss') || txt.includes('tragedy') || txt.includes('love') || txt.includes('tears') || txt.includes('drama') || txt.includes('sad');
                case 'motivating': return txt.includes('dream') || txt.includes('fight') || txt.includes('success') || txt.includes('hero') || txt.includes('inspire') || txt.includes('rise');
                case 'action': return txt.includes('war') || txt.includes('kill') || txt.includes('action') || txt.includes('fast') || txt.includes('escape') || txt.includes('agent') || txt.includes('police');
                case 'mindbending': return txt.includes('space') || txt.includes('time') || txt.includes('reality') || txt.includes('future') || txt.includes('mystery') || txt.includes('secret') || txt.includes('alien');
                default: return true;
            }
        });
    };

    const getSmartRecommendations = () => {
        if (continueWatching.length === 0) return trending;
        const lastWatched = continueWatching[0];
        // Sort trending/popular to push similar items (pseudo-similarity based on type or simple heuristics)
        const pool = [...trending, ...popular].filter(i => i.tmdb_id !== lastWatched.tmdb_id);
        // We simulate a smart recommendation algorithm:
        return pool.sort(() => 0.5 - Math.random()).slice(0, 15);
    };

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch critical data first (above-the-fold)
                const t = await api.getTrending();
                if (!isMounted) return;
                
                setTrending(t);
                if (t.length > 0) setHeroItem(t[0]);
                setIsLoading(false); // Render UI quickly

                // Fetch secondary data without blocking
                Promise.all([
                    api.getPopularMovies(),
                    api.getTopTV(),
                    api.getLibrary(),
                    api.getContinueWatching(),
                    api.getFavorites(),
                    api.getWatchlist().catch(() => []),
                    api.getHistory(20).catch(() => []),
                ]).then(([p, tv, lib, cw, favs, wl, hist]) => {
                    if (!isMounted) return;
                    setPopular(p);
                    setTopTV(tv);
                    setLibrary(lib);
                    setContinueWatching(cw);
                    setFavorites(favs);
                    setWatchlist(wl);
                    setHistory(hist);
                }).catch(console.error);

            } catch (e) {
                console.error(e);
                setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [navigate]);

    const handleSearch = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setIsSearchLoading(true);
        try {
            const results = await api.search(query);
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchLoading(false);
        }
    }, []);

    const handlePlay = useCallback((item: MediaItem, watchParty = false) => {
        setPlayingItem(item);
        setIsWatchPartyMode(watchParty);
        setModalItem(null);
        api.addToLibrary(item);
    }, []);

    const handleOpenModal = useCallback((item: MediaItem) => {
        setModalItem(item);
    }, []);

    const handleHeroHover = useCallback((item: MediaItem) => {
        setHeroItem(item);
    }, []);

    const handleCategoryChange = useCallback(async (cat: any) => {
        setActiveCategory(cat);
        if (cat === 'favorites') {
            try {
                const favs = await api.getFavorites();
                setFavorites(favs);
            } catch (e) {
                console.error(e);
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-dark text-white pb-20 overflow-x-hidden"
        >
            <Navbar
                onSearch={handleSearch}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
            />

            {isLoading ? (
                <HeroSkeleton />
            ) : !isSearching && (
                <Hero
                    item={heroItem}
                    onPlay={handlePlay}
                    onMoreInfo={handleOpenModal}
                />
            )}

            <div
                className={`relative z-20 ${!isSearching && activeCategory === 'all' && !isLoading ? '-mt-24 transition-all duration-700' : 'pt-24 md:pt-32'}`}
                style={{ contain: 'layout' }}
            >
                {isSearching ? (
                    <div className="px-6 md:px-12">
                        <div className="flex items-center gap-4 mb-8 ml-2">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/30">
                                {isSearchLoading ? 'Searching...' : 'Search Results'}
                            </h2>
                            {isSearchLoading && (
                                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                        
                        {isSearchLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-12">
                                {[...Array(12)].map((_, i) => <PosterSkeleton key={i} />)}
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-12">
                                {searchResults.map((item, idx) => (
                                    <motion.div
                                        key={`${item.tmdb_id}-${idx}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                    >
                                        <Poster
                                            item={item}
                                            onClick={() => handleOpenModal(item)}
                                            onHover={() => handleHeroHover(item)}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                <SearchX className="w-20 h-20 mb-6 stroke-1" />
                                <p className="text-xl font-bold tracking-tight">No results found for your search</p>
                            </div>
                        )}
                    </div>
                ) : activeCategory !== 'all' ? (
                    <div className="px-6 md:px-12 pb-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 ml-2 gap-4">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                                {activeCategory === 'movie' ? 'All Movies' :
                                    activeCategory === 'tv' ? 'TV Shows' :
                                        activeCategory === 'list' ? 'Your Library' :
                                            'Your Favorites'}
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">
                                {activeCategory === 'movie' ? popular.length :
                                    activeCategory === 'tv' ? topTV.length :
                                        activeCategory === 'list' ? library.length :
                                            favorites.length} Titles
                            </span>
                        </div>
                        
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-12">
                                {[...Array(12)].map((_, i) => <PosterSkeleton key={i} />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-12">
                                {(activeCategory === 'movie' ? popular :
                                    activeCategory === 'tv' ? topTV :
                                        activeCategory === 'list' ? library :
                                            favorites).map((item, idx) => (
                                                <motion.div
                                                    key={`${item.tmdb_id}-${idx}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                                >
                                                    <Poster
                                                        item={item}
                                                        onClick={() => handleOpenModal(item)}
                                                        onHover={() => handleHeroHover(item)}
                                                    />
                                                </motion.div>
                                            ))}
                            </div>
                        )}
                        
                        {!isLoading && (activeCategory === 'list' && library.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                <AlertCircle className="w-20 h-20 mb-6 stroke-1" />
                                <p className="text-xl font-bold tracking-tight">Your library is empty</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-8">
                        {isLoading ? (
                            <>
                                <RowSkeleton />
                                <RowSkeleton />
                                <RowSkeleton />
                            </>
                        ) : (
                            <>
                                {/* Mood Picker */}
                                <div className="px-6 md:px-12 py-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Quel est votre mood ?
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {MOODS.map(mood => (
                                            <button
                                                key={mood.id}
                                                onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
                                                className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 ${activeMood === mood.id ? mood.color.replace('/10', '/30').replace('/20', '/50') + ' scale-105 shadow-xl ring-2 ring-white/20' : mood.color}`}
                                            >
                                                {mood.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {activeMood && (
                                    <Row title="Sélection pour votre mood" items={getMoodResults()} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                )}

                                {!activeMood && continueWatching.length > 0 && (
                                    <>
                                        <Row title="Continue Watching" items={continueWatching} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                        <Row title={`Because you watched ${continueWatching[0].title}`} items={getSmartRecommendations()} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                    </>
                                )}
                                
                                {!activeMood && (
                                    <>
                                        {watchlist.length > 0 && <Row title="Your Watchlist" items={watchlist} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />}
                                        <Row title="Popular Movies" items={popular} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                        <Row title="Top TV Shows" items={topTV} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                        <Row title="Trending Now" items={trending} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                        {history.length > 0 && <Row title="Recently Watched" items={history} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />}
                                        <Row title="Top 10 Today" items={trending.slice(0, 10)} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                                        {library.length > 0 && <Row title="Your Library" items={library} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-8 right-8 z-[90] p-4 bg-brand text-white rounded-full shadow-2xl hover:bg-brand-hover transition-colors"
                    >
                        <ArrowUp className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Global Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-8 left-1/2 z-[150] bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
                    >
                        <Check className="w-4 h-4 text-brand" /> {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {modalItem && (
                    <MoreInfoModal
                        key="modal"
                        item={modalItem}
                        onClose={() => setModalItem(null)}
                        onPlay={handlePlay}
                        onToast={showToast}
                    />
                )}
                {playingItem && (
                    <VideoPlayer
                        key="player"
                        item={playingItem}
                        onClose={() => setPlayingItem(null)}
                        defaultWatchParty={isWatchPartyMode}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

