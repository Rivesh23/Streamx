import { memo } from 'react';
import { motion } from 'framer-motion';
import { MediaItem } from '../api';
import { preloadMovie } from '../preloader';

interface PosterProps {
    item: MediaItem;
    onClick: (item: MediaItem) => void;
    onHover?: (item: MediaItem) => void;
}

const Poster = memo(function Poster({ item, onClick, onHover }: PosterProps) {
    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(item)}
            onMouseEnter={() => {
                onHover?.(item);
                if (!item.is_local) {
                    // Start preload after 300ms hover
                    (window as any)[`preload_${item.tmdb_id}`] = setTimeout(() => {
                        preloadMovie(item.tmdb_id, item.type);
                    }, 300);
                }
            }}
            onMouseLeave={() => {
                clearTimeout((window as any)[`preload_${item.tmdb_id}`]);
            }}
            role="button"
            aria-label={`View details for ${item.title}`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(item);
                }
            }}
            style={{ willChange: 'transform, z-index' }}
            className="relative flex-none w-36 sm:w-44 md:w-52 aspect-[2/3] cursor-pointer group z-0 hover:z-30 snap-start focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-4 focus:ring-offset-dark rounded-[1rem] md:rounded-[2rem]"
        >
            {/* Main Poster Container with rounding and hidden overflow */}
            <div
                style={{ willChange: 'box-shadow, transform' }}
                className="absolute inset-0 rounded-[1rem] md:rounded-[2rem] overflow-hidden shadow-xl transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            >
                <img
                    src={item.poster}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Progress Bar Overlay */}
                {item.progress && item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 md:h-1.5 bg-white/20 z-10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.progress / 3600) * 100, 100)}%` }}
                            className="h-full bg-brand shadow-[0_0_10px_#E50914]"
                        />
                    </div>
                )}

                {/* Soft Bezel highlight Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 border border-white/30 rounded-[1rem] md:rounded-[2rem] transition-opacity duration-500 pointer-events-none" />
                
                {/* Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-4 md:p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 backdrop-blur-sm">
                    <p className="text-sm md:text-lg font-black tracking-tight leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2 text-white">{item.title}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-brand drop-shadow-md">{item.is_local ? 'LOCAL' : '4K HDR'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default Poster;
