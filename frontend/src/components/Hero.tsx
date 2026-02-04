import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { MediaItem } from '../api';
import { memo } from 'react';

interface HeroProps {
    item: MediaItem | null;
    onPlay: (item: MediaItem) => void;
    onMoreInfo: (item: MediaItem) => void;
}

const Hero = memo(function Hero({ item, onPlay, onMoreInfo }: HeroProps) {
    if (!item) return <div className="h-screen bg-dark animate-pulse" />;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-dark">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={item.tmdb_id}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ willChange: 'transform, opacity' }}
                    className="absolute inset-0"
                >
                    <img
                        src={item.backdrop || item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-black/80" />
                    <div className="absolute inset-0 bg-apple-mask opacity-80" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-20 pb-32 pt-40 z-10 pointer-events-none">
                <motion.div
                    key={`content-${item.tmdb_id}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-3xl pointer-events-auto"
                >
                    <h1 className="text-7xl md:text-8xl font-black mb-8 tracking-tighter drop-shadow-2xl leading-[0.95] max-w-4xl gpu-accelerated">
                        {item.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/60 mb-12 line-clamp-2 leading-relaxed drop-shadow-lg font-medium max-w-2xl">
                        {item.overview}
                    </p>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => onPlay(item)}
                            className="flex items-center gap-4 bg-white text-black px-12 py-5 rounded-[2rem] font-black hover:bg-brand hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl gpu-accelerated"
                        >
                            <Play className="fill-current w-6 h-6" /> Play
                        </button>
                        <button
                            onClick={() => onMoreInfo(item)}
                            className="flex items-center gap-4 bg-white/10 backdrop-blur-xl text-white px-12 py-5 rounded-[2rem] font-black hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10 gpu-accelerated"
                        >
                            <Info className="w-6 h-6" /> More Info
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-dark to-transparent z-0 pointer-events-none" />
        </div>
    );
});

export default Hero;
