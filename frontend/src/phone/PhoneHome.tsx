import { useState, useEffect, useCallback } from 'react';
import { api, MediaItem } from '../api';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search, Home as HomeIcon, Film, Tv, Heart, User, Play, Plus, Star, X,
    ChevronRight, Settings as SettingsIcon, LogOut, Smartphone, Bell,
    Download, Shield, HelpCircle, Moon, Globe, Trash2
} from 'lucide-react';
import { useDevice } from '../DeviceContext';
import PhonePlayer from './PhonePlayer';

type Tab = 'home' | 'movies' | 'tv' | 'search' | 'profile';

export default function PhoneHome() {
    const { clearDevice } = useDevice();
    const [tab, setTab] = useState<Tab>('home');
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [topTV, setTopTV] = useState<MediaItem[]>([]);
    const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
    const [favorites, setFavorites] = useState<MediaItem[]>([]);
    const [library, setLibrary] = useState<MediaItem[]>([]);
    const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
    const [history, setHistory] = useState<MediaItem[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
    const [activeProfile, setActiveProfile] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('streamx_active_profile');
        if (stored) {
            try { setActiveProfile(JSON.parse(stored)); } catch(e) {}
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [t, p, tv, cw, lib, fav, wl, hist, st] = await Promise.all([
                    api.getTrending(),
                    api.getPopularMovies(),
                    api.getTopTV(),
                    api.getContinueWatching().catch(() => []),
                    api.getLibrary().catch(() => []),
                    api.getFavorites().catch(() => []),
                    api.getWatchlist().catch(() => []),
                    api.getHistory(20).catch(() => []),
                    api.getStats().catch(() => null)
                ]);
                setTrending(t);
                setPopular(p);
                setTopTV(tv);
                setContinueWatching(cw);
                setLibrary(lib);
                setFavorites(fav);
                setWatchlist(wl);
                setHistory(hist);
                setStats(st);
            } catch (e) { console.error(e); }
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleSearch = useCallback(async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const res = await api.search(q);
            setSearchResults(res);
        } catch (e) { console.error(e); }
    }, []);

    const getRows = (): { title: string; items: MediaItem[] }[] => {
        switch (tab) {
            case 'movies': return [
                { title: 'Popular Movies', items: popular },
                { title: 'Trending', items: trending.filter(i => i.type === 'movie') },
            ];
            case 'tv': return [
                { title: 'Top TV Shows', items: topTV },
                { title: 'Trending', items: trending.filter(i => i.type === 'tv') },
            ];
            default:
                const rows = [];
                if (continueWatching.length > 0) rows.push({ title: 'Continue Watching', items: continueWatching });
                if (watchlist.length > 0) rows.push({ title: 'Your Watchlist', items: watchlist });
                rows.push({ title: 'Trending Now', items: trending });
                rows.push({ title: 'Popular Movies', items: popular });
                rows.push({ title: 'Top TV Shows', items: topTV });
                if (history.length > 0) rows.push({ title: 'Recently Watched', items: history });
                if (favorites.length > 0) rows.push({ title: 'My Favorites', items: favorites });
                if (library.length > 0) rows.push({ title: 'Your Library', items: library });
                return rows;
        }
    };

    const heroItem = trending[0];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 relative">
            {/* Playing item */}
            <AnimatePresence>
                {playingItem && (
                    <PhonePlayer item={playingItem} onClose={() => setPlayingItem(null)} />
                )}
            </AnimatePresence>

            {/* Detail sheet */}
            <AnimatePresence>
                {selectedItem && (
                    <PhoneDetailSheet
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onPlay={() => { setPlayingItem(selectedItem); setSelectedItem(null); }}
                    />
                )}
            </AnimatePresence>

            {/* Profile Tab Content */}
            {tab === 'profile' ? (
                <PhoneProfileTab profile={activeProfile} onClearDevice={clearDevice} stats={stats} />
            ) : tab === 'search' ? (
                /* Search Tab */
                <div className="px-4 pt-6">
                    <h1 className="text-2xl font-black mb-5">Search</h1>
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                        <input
                            type="text"
                            placeholder="Movies, shows, actors..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                            className="w-full bg-white/[0.06] rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium outline-none border border-white/[0.06] focus:border-white/20 transition-all placeholder-white/20 text-white"
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {searchResults.map(item => (
                                <PhonePoster key={item.tmdb_id} item={item} onTap={() => setSelectedItem(item)} />
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <div className="flex flex-col items-center justify-center pt-20 text-white/20">
                            <Search className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">No results found</p>
                        </div>
                    ) : (
                        /* Trending suggestions when no search */
                        <div>
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Trending Searches</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {trending.slice(0, 9).map(item => (
                                    <PhonePoster key={item.tmdb_id} item={item} onTap={() => setSelectedItem(item)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Home / Movies / TV Tabs */
                <>
                    {/* Status bar area + greeting */}
                    <div className="px-4 pt-6 pb-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white/30 font-medium">
                                {tab === 'home' ? 'Welcome back' : tab === 'movies' ? 'Browse' : 'Discover'}
                            </p>
                            <h1 className="text-2xl font-black">
                                {tab === 'home' ? (activeProfile?.name || 'Home') : tab === 'movies' ? 'Movies' : 'TV Shows'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/[0.06]">
                                <Bell className="w-5 h-5 text-white/40" />
                            </button>
                            {activeProfile && (
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeProfile.color || 'from-[#E50914] to-[#8B0000]'} flex items-center justify-center text-lg shadow-md`}>
                                    {activeProfile.avatar || '😎'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hero Card */}
                    {tab === 'home' && heroItem && !isLoading && (
                        <div className="px-4 pb-5">
                            <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl">
                                <img src={heroItem.backdrop || heroItem.poster || ''} className="w-full h-full object-cover" alt={heroItem.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                {/* Top 10 Badge */}
                                <div className="absolute top-4 left-4 bg-[#E50914] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    Top 10
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <h2 className="text-xl font-black leading-tight mb-1 drop-shadow-lg">{heroItem.title}</h2>
                                    <p className="text-xs text-white/50 mb-4 line-clamp-1">{heroItem.overview}</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setPlayingItem(heroItem)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform shadow-lg"
                                        >
                                            <Play className="w-4 h-4 fill-black" /> Play
                                        </button>
                                        <button
                                            onClick={() => setSelectedItem(heroItem)}
                                            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white font-bold py-3 px-5 rounded-xl text-sm border border-white/10 active:scale-95 transition-transform"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Rows */}
                    {isLoading ? (
                        <div className="px-4 space-y-8 pt-2">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="h-4 w-32 bg-white/5 rounded-lg mb-4 animate-pulse" />
                                    <div className="flex gap-3 overflow-hidden">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="w-28 h-40 bg-white/5 rounded-2xl animate-pulse flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-7">
                            {getRows().map(row => (
                                <div key={row.title}>
                                    <div className="flex items-center justify-between px-4 mb-3">
                                        <h3 className="text-base font-bold text-white">{row.title}</h3>
                                        <ChevronRight className="w-4 h-4 text-white/20" />
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                                        {row.items.map(item => (
                                            <PhonePoster key={item.tmdb_id} item={item} onTap={() => setSelectedItem(item)} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Bottom Tab Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/[0.05]">
                    <div className="flex items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                        {([
                            { id: 'home' as Tab, icon: HomeIcon, label: 'Home' },
                            { id: 'movies' as Tab, icon: Film, label: 'Movies' },
                            { id: 'tv' as Tab, icon: Tv, label: 'TV' },
                            { id: 'search' as Tab, icon: Search, label: 'Search' },
                            { id: 'profile' as Tab, icon: User, label: 'Profile' },
                        ]).map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className="flex flex-col items-center gap-0.5 py-1.5 px-4 relative"
                                >
                                    <Icon className={`w-5 h-5 transition-colors duration-200 ${active ? 'text-white' : 'text-white/25'}`} strokeWidth={active ? 2.5 : 1.5} />
                                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-white' : 'text-white/25'}`}>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Phone Poster ── */
function PhonePoster({ item, onTap }: { item: MediaItem; onTap: () => void }) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTap}
            className="flex-shrink-0 w-28 relative"
        >
            <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.04] mb-1.5 relative">
                {item.poster ? (
                    <img src={item.poster} className="w-full h-full object-cover" alt={item.title} loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                        <Film className="w-8 h-8" />
                    </div>
                )}
                {item.progress && item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                        <div className="h-full bg-[#E50914] rounded-full" style={{ width: `${item.progress}%` }} />
                    </div>
                )}
            </div>
            <p className="text-[11px] text-white/50 font-medium truncate px-0.5">{item.title}</p>
        </motion.button>
    );
}

/* ── Phone Detail Sheet ── */
function PhoneDetailSheet({ item, onClose, onPlay }: { item: MediaItem; onClose: () => void; onPlay: () => void }) {
    const [isFav, setIsFav] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);

    useEffect(() => {
        api.checkFavorite(item.tmdb_id).then(res => setIsFav(res.is_favorite)).catch(() => {});
        api.checkWatchlist(item.tmdb_id).then(res => setInWatchlist(res.in_watchlist)).catch(() => {});
    }, [item.tmdb_id]);

    const toggleFav = async () => {
        try {
            const res = await api.toggleFavorite(item);
            setIsFav(res.is_favorite);
        } catch(e) {}
    };

    const toggleWatchlist = async () => {
        try {
            const res = await api.toggleWatchlist(item);
            setInWatchlist(res.in_watchlist);
        } catch(e) {}
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 max-h-[88vh] bg-[#141414] rounded-t-[2rem] overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Drag handle */}
                <div className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-[#141414]">
                    <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                {/* Backdrop */}
                <div className="relative w-full aspect-video overflow-hidden">
                    <img src={item.backdrop || item.poster || ''} className="w-full h-full object-cover" alt={item.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 pb-10 -mt-8 relative z-10">
                    <h2 className="text-2xl font-black mb-1">{item.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-white/35 font-bold mb-5">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 8.5</span>
                        <span className="uppercase">{item.type}</span>
                        {item.is_local && <span className="text-[#E50914] font-black">LOCAL</span>}
                    </div>

                    {item.overview && (
                        <p className="text-[13px] text-white/45 leading-relaxed mb-6">{item.overview}</p>
                    )}

                    {/* Actions */}
                    <button
                        onClick={onPlay}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-transform mb-3 shadow-lg"
                    >
                        <Play className="w-5 h-5 fill-black" /> Play
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={toggleFav}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-95 transition-all border ${
                                isFav ? 'bg-[#E50914]/10 border-[#E50914]/30 text-[#E50914]' : 'bg-white/[0.05] border-white/[0.06] text-white/60'
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-[#E50914]' : ''}`} />
                            {isFav ? 'Saved' : 'Favorite'}
                        </button>
                        <button
                            onClick={toggleWatchlist}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-95 transition-all border ${
                                inWatchlist ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500' : 'bg-white/[0.05] border-white/[0.06] text-white/60'
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            {inWatchlist ? 'Added' : 'Watchlist'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ── Phone Profile Tab ── */
function PhoneProfileTab({ profile, onClearDevice, stats }: { profile: any; onClearDevice: () => void; stats: any }) {
    const SETTINGS = [
        { icon: User, label: 'Account', desc: 'Manage your account details', action: null },
        { icon: Bell, label: 'Notifications', desc: 'Push & email preferences', action: null },
        { icon: Download, label: 'Downloads', desc: 'Manage downloaded content', action: null },
        { icon: Globe, label: 'Language', desc: 'English', action: null },
        { icon: Moon, label: 'Appearance', desc: 'Dark mode', action: null },
        { icon: Shield, label: 'Privacy', desc: 'Data & privacy settings', action: null },
        { icon: HelpCircle, label: 'Help', desc: 'FAQ & support', action: null },
    ];

    return (
        <div className="px-5 pt-8 pb-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profile?.color || 'from-[#E50914] to-[#8B0000]'} flex items-center justify-center text-2xl shadow-lg`}>
                    {profile?.avatar || '😎'}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-black">{profile?.name || 'User'}</h2>
                    <p className="text-xs text-white/30 font-medium">Premium • StreamX</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.06]">
                    <SettingsIcon className="w-4 h-4 text-white/40" />
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    { label: 'Watchlist', value: stats?.watchlist || 0 },
                    { label: 'Favorites', value: stats?.favorites || 0 },
                    { label: 'History', value: stats?.history || 0 },
                ].map(stat => (
                    <div key={stat.label} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 text-center">
                        <p className="text-xl font-black text-white">{stat.value}</p>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Settings List */}
            <div className="space-y-1 mb-6">
                {SETTINGS.map(item => {
                    const Icon = item.icon;
                    return (
                        <button key={item.label} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-white">{item.label}</p>
                                <p className="text-[11px] text-white/25">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15" />
                        </button>
                    );
                })}
            </div>

            {/* Device & Logout */}
            <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                <button
                    onClick={onClearDevice}
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/[0.04] transition-colors"
                >
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">Switch Device</p>
                        <p className="text-[11px] text-white/25">Currently using Phone mode</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/15" />
                </button>

                <button className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-red-500/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-red-400">Sign Out</p>
                    </div>
                </button>
            </div>

            {/* Version */}
            <p className="text-center text-[10px] text-white/10 font-medium mt-8">StreamX v2.0 • Built with ❤️</p>
        </div>
    );
}
