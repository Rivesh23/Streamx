import { useRef, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../api';
import Poster from './Poster';

interface RowProps {
    title: string;
    items: MediaItem[];
    onPosterClick: (item: MediaItem) => void;
    onPosterHover?: (item: MediaItem) => void;
}

const Row = memo(function Row({ title, items, onPosterClick, onPosterHover }: RowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            const offset = dir === 'left' ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="mb-12 group/row relative px-6 md:px-12 lg:px-16" style={{ contain: 'content' }}>
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-white/90 tracking-tight">{title}</h2>

            <div className="relative group/scroll">
                <button
                    onClick={() => scroll('left')}
                    aria-label={`Scroll ${title} left`}
                    className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white text-white hover:text-black w-10 h-10 md:w-14 md:h-14 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl active:scale-90 hidden md:flex"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-8 snap-x px-2 -mx-2 scroll-smooth"
                    style={{ willChange: 'transform, scroll-position', WebkitOverflowScrolling: 'touch' }}
                >
                    {items.map((item) => (
                        <Poster
                            key={item.tmdb_id}
                            item={item}
                            onClick={onPosterClick}
                            onHover={onPosterHover}
                        />
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    aria-label={`Scroll ${title} right`}
                    className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white text-white hover:text-black w-10 h-10 md:w-14 md:h-14 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl active:scale-90 hidden md:flex"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
            </div>
        </div>
    );
});

export default Row;
