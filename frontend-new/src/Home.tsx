
import { useState, useEffect } from 'react';
import { api } from './api';
import type { MediaItem } from './api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Row from './components/Row';
import VideoPlayer from './components/VideoPlayer';
import MoreInfoModal from './components/MoreInfoModal';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
    category?: 'all' | 'movie' | 'tv' | 'list';
}

export default function Home({ category = 'all' }: HomeProps) {
    const navigate = useNavigate();
    const [library, setLibrary] = useState<MediaItem[]>([]);
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topTV, setTopTV] = useState<MediaItem[]>([]);

    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
    const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
    const [modalItem, setModalItem] = useState<MediaItem | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const loadData = async () => {
            try {
                const [libData, trendData, popData, tvData] = await Promise.all([
                    api.getLibrary(),
                    api.getTrending(),
                    api.getPopularMovies(),
                    api.getTopTV()
                ]);

                setLibrary(libData);
                setTrending(trendData);
                setPopular(popData);
                setTopTV(tvData);

                if (trendData.length > 0) setHeroItem(trendData[0]);

            } catch (e) {
                console.error("Failed to load media", e);
            }
        };
        loadData();
    }, [navigate]);

    // Hero Carousel
    useEffect(() => {
        if (isSearching || playingItem || modalItem) return;

        const interval = setInterval(() => {
            setHeroItem(prev => {
                if (!prev || trending.length === 0) return prev;
                const idx = trending.findIndex(i => i.tmdb_id === prev.tmdb_id);
                const nextIdx = (idx + 1) % trending.length;
                return trending[nextIdx];
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [trending, isSearching, playingItem, modalItem]);


    const handleSearch = async (query: string) => {
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
    };

    const handlePlay = (item: MediaItem) => {
        setPlayingItem(item);
        setModalItem(null);
        api.addToLibrary(item);
    };

    const handleMoreInfo = (item: MediaItem) => {
        setModalItem(item);
    };

    return (
        <div className="min-h-screen bg-[#141414] pb-20 overflow-x-hidden">
            <Navbar onSearch={handleSearch} />

            {!isSearching && (
                <Hero item={heroItem} onPlay={handlePlay} onMoreInfo={handleMoreInfo} />
            )}

            <div className={`relative z - 20 ${!isSearching ? '-mt-32' : 'mt-24'} `}>
                {isSearching ? (
                    <Row
                        title="Search Results"
                        items={searchResults}
                        onPosterClick={handleMoreInfo}
                        onPosterHover={setHeroItem}
                    />
                ) : (
                    <>
                        {category === 'all' && (
                            <>
                                <Row title="Trending Now" items={trending} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                                <Row title="Popular Movies" items={popular} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                                <Row title="Top TV Shows" items={topTV} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                                <Row title="Your Library" items={library} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                            </>
                        )}

                        {category === 'movie' && (
                            <>
                                <Row title="Popular Movies" items={popular} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                                <Row title="Trending Movies" items={trending.filter(i => i.type === 'movie')} onPosterClick={handleMoreInfo} onPosterHover={setHeroItem} />
                            </>
                        )}

                        {category === 'tv' && (
                            <>
                                <Row title="Top TV Shows" items={topTV} onPosterClick={handlePlay} onPosterHover={setHeroItem} />
                                <Row title="Trending TV" items={trending.filter(i => i.type === 'tv')} onPosterClick={handlePlay} onPosterHover={setHeroItem} />
                            </>
                        )}

                        {category === 'list' && (
                            <Row title="Your Library" items={library} onPosterClick={handlePlay} onPosterHover={setHeroItem} />
                        )}
                    </>
                )}
            </div>

            {playingItem && (
                <VideoPlayer item={playingItem} onClose={() => setPlayingItem(null)} />
            )}

            {modalItem && (
                <MoreInfoModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onPlay={handlePlay}
                />
            )}
        </div>
    );
}

