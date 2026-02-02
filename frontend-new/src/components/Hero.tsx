import { Play, Info } from 'lucide-react';
import type { MediaItem } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
    item: MediaItem | null;
    onPlay: (item: MediaItem) => void;
    onMoreInfo: (item: MediaItem) => void;
}

export default function Hero({ item, onPlay, onMoreInfo }: HeroProps) {
    if (!item) return null;

    const backdropUrl = item.backdrop || item.poster;

    return (
        <div className="relative h-[80vh] w-full text-white overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={item.tmdb_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 flex flex-col justify-center h-full px-12 max-w-2xl">
                <motion.h1
                    key={`title-${item.tmdb_id}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl font-extrabold pb-4 drop-shadow-lg"
                >
                    {item.title}
                </motion.h1>
                <motion.p
                    key={`desc-${item.tmdb_id}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-gray-200 line-clamp-3 mb-8 drop-shadow-md"
                >
                    {item.overview}
                </motion.p>

                <div className="flex gap-4">
                    <button
                        onClick={() => onPlay(item)}
                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-opacity-80 transition"
                    >
                        <Play className="fill-black w-6 h-6" /> Play
                    </button>
                    <button
                        onClick={() => onMoreInfo(item)}
                        className="flex items-center gap-2 bg-gray-500/70 text-white px-8 py-3 rounded-md font-bold hover:bg-opacity-50 transition backdrop-blur-sm"
                    >
                        <Info className="w-6 h-6" /> More Info
                    </button>
                </div>
            </div>
        </div>
    );
}
