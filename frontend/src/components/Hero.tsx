import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { MediaItem } from '../api';
import { memo } from 'react';
import { HeroSkeleton } from './Skeleton';

interface HeroProps {
    item: MediaItem | null;
    onPlay: (item: MediaItem) => void;
    onMoreInfo: (item: MediaItem) => void;
}

const Hero = memo(function Hero({ item, onPlay, onMoreInfo }: HeroProps) {
    if (!item) return <HeroSkeleton />;

    return (
        <div className="relative h-[85vh] md:h-screen w-full overflow-hidden bg-dark">
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
                        alt=""
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-black/60" />
                    <div className="absolute inset-0 bg-black/20" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-12 md:px-20 pb-20 md:pb-32 pt-40 z-10 pointer-events-none">
                <motion.div
                    key={`content-${item.tmdb_id}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-4xl pointer-events-auto"
                >
                    <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-[0.9] gpu-accelerated text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                        {item.title}
                    </h1>
                    <div className="liquid-blur p-6 md:p-8 rounded-[2rem] border border-white/10 mb-8 max-w-3xl shadow-apple-lift">
                        <p className="text-lg md:text-xl text-white/90 line-clamp-3 leading-relaxed font-medium">
                            {item.overview}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                        <button
                            onClick={() => onPlay(item)}
                            aria-label={`Play ${item.title}`}
                            className="flex items-center justify-center gap-3 bg-white text-black px-10 md:px-14 py-4 md:py-5 rounded-full font-black hover:bg-brand hover:text-white hover:shadow-[0_0_40px_rgba(229,9,20,0.6)] transition-all duration-500 hover:scale-105 active:scale-95 gpu-accelerated min-w-[160px]"
                        >
                            <Play className="fill-current w-5 h-5 md:w-6 md:h-6" /> Play
                        </button>
                        <button
                            onClick={() => onMoreInfo(item)}
                            aria-label={`More information about ${item.title}`}
                            className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-3xl text-white px-10 md:px-14 py-4 md:py-5 rounded-full font-black hover:bg-white/20 transition-all duration-500 hover:scale-105 active:scale-95 border border-white/10 shadow-apple-focus gpu-accelerated min-w-[160px]"
                        >
                            <Info className="w-5 h-5 md:w-6 md:h-6" /> Info
                        </button>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-dark to-transparent z-0 pointer-events-none" />
        </div>
    );
});

export default Hero;
