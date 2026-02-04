import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, MediaItem } from './api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Row from './components/Row';
import Poster from './components/Poster';
import MoreInfoModal from './components/MoreInfoModal';
import VideoPlayer from './components/VideoPlayer';
import { AnimatePresence, motion } from 'framer-motion';

interface HomeProps {
    category?: 'all' | 'movie' | 'tv' | 'list' | 'favorites';
}

export default function Home({ category: routeCategory = 'all' }: HomeProps) {
    const navigate = useNavigate();
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topTV, setTopTV] = useState<MediaItem[]>([]);
    const [library, setLibrary] = useState<MediaItem[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const [favorites, setFavorites] = useState<MediaItem[]>([]);

    const [activeCategory, setActiveCategory] = useState(routeCategory);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
    const [modalItem, setModalItem] = useState<MediaItem | null>(null);
    const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const loadData = async () => {
            try {
                const [t, p, tv, lib, cw, favs] = await Promise.all([
                    api.getTrending(),
                    api.getPopularMovies(),
                    api.getTopTV(),
                    api.getLibrary(),
                    api.getContinueWatching(),
                    api.getFavorites()
                ]);
                setTrending(t);
                setPopular(p);
                setTopTV(tv);
                setLibrary(lib);
                setContinueWatching(cw);
                setFavorites(favs);
                if (t.length > 0) setHeroItem(t[0]);
            } catch (e) {
                console.error(e);
            }
        };
        loadData();
    }, [navigate]);

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await api.search(query);
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const handlePlay = useCallback((item: MediaItem) => {
        setPlayingItem(item);
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
        // If switching to favorites, refresh the list
        if (cat === 'favorites') {
            try {
                const favs = await api.getFavorites();
                setFavorites(favs);
            } catch (e) {
                console.error(e);
            }
        }
        // Scroll to top when changing categories
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

            {!isSearching && (
                <Hero
                    item={heroItem}
                    onPlay={handlePlay}
                    onMoreInfo={handleOpenModal}
                />
            )}

            <div
                className={`relative z-20 ${!isSearching && activeCategory === 'all' ? '-mt-24 transition-all duration-700' : 'pt-32'}`}
                style={{ contain: 'layout' }}
            >
                {isSearching ? (
                    <div className="px-12">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/30 mb-8 ml-2">Search Results</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12">
                            {searchResults.map((item, idx) => (
                                <motion.div
                                    key={`${item.tmdb_id}-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Poster
                                        item={item}
                                        onClick={() => handleOpenModal(item)}
                                        onHover={() => handleHeroHover(item)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : activeCategory !== 'all' ? (
                    <div className="px-12 pb-20">
                        <div className="flex items-end justify-between mb-12 ml-2">
                            <h2 className="text-3xl font-black tracking-tighter">
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12">
                            {(activeCategory === 'movie' ? popular :
                                activeCategory === 'tv' ? topTV :
                                    activeCategory === 'list' ? library :
                                        favorites).map((item, idx) => (
                                            <motion.div
                                                key={`${item.tmdb_id}-${idx}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <Poster
                                                    item={item}
                                                    onClick={() => handleOpenModal(item)}
                                                    onHover={() => handleHeroHover(item)}
                                                />
                                            </motion.div>
                                        ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {continueWatching.length > 0 && (
                            <Row title="Continue Watching" items={continueWatching} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                        )}
                        <Row title="Popular Movies" items={popular} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                        <Row title="Top TV Shows" items={topTV} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                        <Row title="Trending Now" items={trending} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                        <Row title="Your Library" items={library} onPosterClick={handleOpenModal} onPosterHover={handleHeroHover} />
                    </>
                )}
            </div>

            <AnimatePresence mode="wait">
                {modalItem && (
                    <MoreInfoModal
                        key="modal"
                        item={modalItem}
                        onClose={() => setModalItem(null)}
                        onPlay={handlePlay}
                    />
                )}
                {playingItem && (
                    <VideoPlayer
                        key="player"
                        item={playingItem}
                        onClose={() => setPlayingItem(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
