import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, Heart, Check } from 'lucide-react';
import { api, MediaItem } from '../api';

interface MoreInfoModalProps {
    item: MediaItem;
    onClose: () => void;
    onPlay: (item: MediaItem) => void;
}

export default function MoreInfoModal({ item, onClose, onPlay }: MoreInfoModalProps) {
    const [added, setAdded] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const checkFav = async () => {
            try {
                const res = await api.checkFavorite(item.tmdb_id);
                setIsFavorite(res.is_favorite);
            } catch (e) {
                console.error(e);
            }
        };
        checkFav();
    }, [item.tmdb_id]);

    const handleAdd = async () => {
        try {
            await api.addToLibrary(item);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleFavorite = async () => {
        try {
            const res = await api.toggleFavorite(item);
            setIsFavorite(res.status === 'added');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-dark/80 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-6xl md:max-w-[70vw] bg-surface/95 backdrop-blur-3xl rounded-4xl overflow-hidden shadow-apple-focus border border-white/5"
            >
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-50 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                <div className="relative min-h-[65vh] flex flex-col justify-end">
                    <div className="absolute inset-0">
                        <img
                            src={item.backdrop || item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-black/30" />
                        <div className="absolute inset-x-0 bottom-0 h-64 bg-apple-mask opacity-95" />
                    </div>

                    <div className="relative z-10 px-6 md:px-16 pb-20 pt-40">
                        <h2 className="text-4xl md:text-6xl font-black mb-10 drop-shadow-2xl tracking-tighter leading-[0.9] max-w-4xl text-white">
                            {item.title}
                        </h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onPlay(item)}
                                className="flex items-center gap-4 bg-white text-black px-12 py-5 rounded-[2rem] font-black hover:bg-brand hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
                            >
                                <Play className="fill-current w-6 h-6" /> Play Now
                            </button>
                            <button
                                onClick={handleAdd}
                                className={`p-5 rounded-full transition-all border shadow-2xl active:scale-90 ${added ? 'bg-brand text-white border-brand' : 'liquid-blur hover:bg-white/10 border-white/10'}`}
                            >
                                {added ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-5 rounded-full transition-all border shadow-2xl active:scale-90 ${isFavorite ? 'bg-brand text-white border-brand' : 'liquid-blur hover:bg-white/10 border-white/10'}`}
                            >
                                <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'fill-white' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-16 py-12 grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div className="md:col-span-2 space-y-8">
                        <div className="flex items-center gap-6 text-sm font-black tracking-widest uppercase">
                            <span className="text-brand">98% Match</span>
                            <span className="text-white/40">2024</span>
                            <span className="px-3 py-1 border border-white/10 rounded-full text-[10px] text-white/60 bg-white/5">4K HDR</span>
                        </div>
                        <p className="text-xl md:text-2xl leading-relaxed text-white/80 font-medium">
                            {item.overview}
                        </p>
                    </div>

                    <div className="space-y-8 text-[13px] font-medium border-l border-white/5 pl-16 hidden md:block">
                        <div>
                            <span className="text-white/20 block mb-2 uppercase tracking-widest text-[10px] font-black">Cast:</span>
                            <span className="text-white/60 leading-relaxed">Dwayne Johnson, Chris Evans, Lucy Liu</span>
                        </div>
                        <div>
                            <span className="text-white/20 block mb-2 uppercase tracking-widest text-[10px] font-black">Genres:</span>
                            <span className="text-white/60 leading-relaxed">Action, Adventure, Fantasy</span>
                        </div>
                        <div>
                            <span className="text-white/20 block mb-2 uppercase tracking-widest text-[10px] font-black">Atmosphere:</span>
                            <span className="text-white/60 leading-relaxed">Exciting, High-Stakes, Epic, Cinematic</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
