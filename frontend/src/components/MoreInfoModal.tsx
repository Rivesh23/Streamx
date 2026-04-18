import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, Heart, Check, Youtube, Download, Users, Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { api, MediaItem } from '../api';

interface MoreInfoModalProps {
    item: MediaItem;
    onClose: () => void;
    onPlay: (item: MediaItem, watchParty?: boolean) => void;
    onToast?: (msg: string) => void;
}

export default function MoreInfoModal({ item, onClose, onPlay, onToast }: MoreInfoModalProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [similar, setSimilar] = useState<MediaItem[]>([]);
    const [buttonStates, setButtonStates] = useState<Record<string, string>>({});

    const handleAction = (key: string, original: string, message: string) => {
        setButtonStates(prev => ({ ...prev, [key]: message }));
        setTimeout(() => {
            setButtonStates(prev => ({ ...prev, [key]: original }));
        }, 2000);
    };

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [favRes, wlRes, ratingRes, simRes] = await Promise.all([
                    api.checkFavorite(item.tmdb_id).catch(() => ({ is_favorite: false })),
                    api.checkWatchlist(item.tmdb_id).catch(() => ({ in_watchlist: false })),
                    api.getRating(item.tmdb_id).catch(() => ({ rating: null })),
                    api.getSimilar(item.tmdb_id, item.type).catch(() => []),
                ]);
                setIsFavorite(favRes.is_favorite);
                setInWatchlist(wlRes.in_watchlist);
                setUserRating(ratingRes.rating);
                setSimilar(Array.isArray(simRes) ? simRes.slice(0, 6) : []);
            } catch (e) { console.error(e); }
        };
        loadAll();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [item.tmdb_id, item.type]);

    const handleAdd = async () => {
        try {
            await api.addToLibrary(item);
            handleAction('add', 'Add to library', 'Added');
            if (onToast) onToast('Added to Your Library');
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleFavorite = async () => {
        try {
            const res = await api.toggleFavorite(item);
            const isFav = res.status === 'added';
            setIsFavorite(isFav);
            if (onToast) onToast(isFav ? 'Added to Favorites' : 'Removed from Favorites');
        } catch (e) { console.error(e); }
    };

    const handleToggleWatchlist = async () => {
        try {
            const res = await api.toggleWatchlist(item);
            setInWatchlist(res.in_watchlist);
            if (onToast) onToast(res.in_watchlist ? 'Added to Watchlist' : 'Removed from Watchlist');
        } catch (e) { console.error(e); }
    };

    const handleRate = async (rating: number) => {
        try {
            await api.rateItem(item.tmdb_id, item.type, rating);
            setUserRating(rating);
            if (onToast) onToast(`Rated ${rating}/10`);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-dark/90 backdrop-blur-xl overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="relative w-full max-w-6xl h-full md:h-auto md:min-h-[80vh] md:max-h-[90vh] bg-surface/95 backdrop-blur-3xl md:rounded-4xl shadow-2xl border-x md:border border-white/5 flex flex-col overflow-hidden"
            >
                <div className="absolute top-6 right-6 z-[60]">
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 transition-all border border-white/10 backdrop-blur-md shadow-2xl"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide">
                    <div className="relative aspect-video md:aspect-auto md:min-h-[55vh] flex flex-col justify-end shrink-0">
                    <div className="absolute inset-0">
                        <img
                            src={item.backdrop || item.poster}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-black/20" />
                    </div>

                    <div className="relative z-10 px-6 md:px-16 pb-12 pt-32">
                        <h2 id="modal-title" className="text-3xl md:text-6xl font-black mb-8 drop-shadow-2xl tracking-tighter leading-[0.9] max-w-4xl text-white">
                            {item.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                            <button
                                onClick={() => onPlay(item)}
                                className="flex items-center gap-3 md:gap-4 bg-white text-black px-8 md:px-12 py-3.5 md:py-5 rounded-full md:rounded-[2rem] font-black hover:bg-brand hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
                            >
                                <Play className="fill-current w-5 h-5 md:w-6 md:h-6" /> Play Now
                            </button>
                            <button
                                onClick={handleAdd}
                                className={`p-3.5 md:p-5 rounded-full transition-all border shadow-2xl active:scale-90 ${buttonStates['add'] === 'Added' ? 'bg-brand text-white border-brand' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                            >
                                {buttonStates['add'] === 'Added' ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-3.5 md:p-5 rounded-full transition-all border shadow-2xl active:scale-90 ${isFavorite ? 'bg-brand text-white border-brand' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                            >
                                <Heart className={`w-5 h-5 md:w-6 md:h-6 transition-all ${isFavorite ? 'fill-white' : ''}`} />
                            </button>
                            <button
                                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' trailer')}`, '_blank')}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 md:py-5 rounded-full md:rounded-[2rem] font-bold transition-all border border-white/10 shadow-2xl min-w-[140px] justify-center"
                            >
                                <Youtube className="w-5 h-5" /> Trailer
                            </button>
                            <button
                                onClick={handleToggleWatchlist}
                                className={`p-3.5 md:p-5 rounded-full transition-all border shadow-2xl active:scale-90 ${inWatchlist ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                            >
                                {inWatchlist ? <BookmarkCheck className="w-5 h-5 md:w-6 md:h-6" /> : <Bookmark className="w-5 h-5 md:w-6 md:h-6" />}
                            </button>
                            <button
                                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' trailer')}`, '_blank')}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 md:py-5 rounded-full md:rounded-[2rem] font-bold transition-all border border-white/10 shadow-2xl min-w-[140px] justify-center"
                            >
                                <Youtube className="w-5 h-5" /> Trailer
                            </button>
                            <button
                                onClick={() => onPlay(item, true)}
                                className="flex items-center gap-2 px-6 py-3.5 md:py-5 rounded-full transition-all border shadow-2xl active:scale-90 bg-white/5 hover:bg-white/10 border-white/10 font-bold min-w-[160px] justify-center"
                            >
                                <Users className="w-5 h-5 md:w-6 md:h-6" /> Watch Party
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-16 py-10 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 shrink-0">
                    <div className="md:col-span-2 space-y-6 md:space-y-8">
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm font-black tracking-widest uppercase">
                            <span className="text-brand flex items-center gap-1"><Star className="w-4 h-4 fill-brand" /> {((item.tmdb_id % 4) + 6).toFixed(1)} Rating</span>
                            <span className="text-white/40">{2024 - (item.tmdb_id % 15)}</span>
                            <span className="px-2 md:px-3 py-1 border border-white/10 rounded-full text-[9px] md:text-[10px] text-white/60 bg-white/5">4K HDR</span>
                            <span className="text-white/40">{1 + (item.tmdb_id % 2)}h {15 + (item.tmdb_id % 40)}m</span>
                        </div>
                        <p className="text-lg md:text-2xl leading-relaxed text-white/80 font-medium">
                            {item.overview}
                        </p>
                        {/* Star Rating */}
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Your Rating:</span>
                            <div className="flex gap-1">
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => handleRate(n)}
                                        onMouseEnter={() => setHoverRating(n)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-125"
                                    >
                                        <Star className={`w-5 h-5 transition-colors ${
                                            (hoverRating || userRating || 0) >= n
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-white/15'
                                        }`} />
                                    </button>
                                ))}
                            </div>
                            {userRating && <span className="text-sm font-bold text-yellow-400">{userRating}/10</span>}
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 text-xs md:text-[13px] font-medium border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-16">
                        <div>
                            <span className="text-white/20 block mb-1.5 md:mb-2 uppercase tracking-widest text-[9px] md:text-[10px] font-black">Cast:</span>
                            <span className="text-white/60 leading-relaxed">Dwayne Johnson, Chris Evans, Lucy Liu</span>
                        </div>
                        <div>
                            <span className="text-white/20 block mb-1.5 md:mb-2 uppercase tracking-widest text-[9px] md:text-[10px] font-black">Genres:</span>
                            <span className="text-white/60 leading-relaxed">Action, Adventure, Fantasy</span>
                        </div>
                        <div>
                            <span className="text-white/20 block mb-1.5 md:mb-2 uppercase tracking-widest text-[9px] md:text-[10px] font-black">Atmosphere:</span>
                            <span className="text-white/60 leading-relaxed">Exciting, High-Stakes, Epic</span>
                        </div>
                    </div>
                </div>

                {similar.length > 0 && (
                    <div className="px-6 md:px-16 pb-10 border-t border-white/5 pt-10 shrink-0">
                        <h3 className="text-xl md:text-2xl font-black mb-6 tracking-tight text-white/90">More Like This</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {similar.map(sim => (
                                <div key={sim.tmdb_id} className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer group flex flex-col h-full shadow-2xl" onClick={() => onPlay(sim)}>
                                    <div className="aspect-video relative shrink-0">
                                        <img src={sim.backdrop || sim.poster} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h4 className="font-bold text-sm md:text-base line-clamp-1">{sim.title}</h4>
                                        <p className="text-[10px] md:text-xs text-white/40 mt-2 line-clamp-3 leading-relaxed flex-1">{sim.overview}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </motion.div>
        </div>
    );
}
