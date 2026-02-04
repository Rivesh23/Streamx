import { memo } from 'react';
import { motion } from 'framer-motion';
import { MediaItem } from '../api';

interface PosterProps {
    item: MediaItem;
    onClick: (item: MediaItem) => void;
    onHover?: (item: MediaItem) => void;
}

const Poster = memo(function Poster({ item, onClick, onHover }: PosterProps) {
    return (
        <motion.div
            whileHover={{
                scale: 1.08,
                transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onClick(item)}
            onMouseEnter={() => onHover?.(item)}
            style={{ willChange: 'transform, z-index' }}
            className="relative flex-none w-52 aspect-[2/3] cursor-pointer group z-0 hover:z-30 snap-start"
        >
            {/* Main Poster Container with rounding and hidden overflow */}
            <div
                style={{ willChange: 'box-shadow, transform' }}
                className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
            >
                <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Progress Bar Overlay */}
                {item.progress && item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 z-10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.progress / 3600) * 100, 100)}%` }} // Approximation: 1 hour max for bar
                            className="h-full bg-brand shadow-[0_0_10px_#E50914]"
                        />
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0">
                    <p className="text-lg font-black tracking-tight leading-tight drop-shadow-md">{item.title}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 shadow-sm">4K HDR</span>
                    </div>
                </div>

                {/* Soft Bezel highlight Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 border-2 border-white/20 rounded-[1.5rem] md:rounded-[2rem] transition-opacity duration-500 pointer-events-none" />

                {/* Surface Glow overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-white to-transparent transition-opacity duration-500 pointer-events-none" />
            </div>
        </motion.div>
    );
});

export default Poster;
