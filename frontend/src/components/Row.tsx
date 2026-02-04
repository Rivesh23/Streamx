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
        <div className="mb-12 group/row relative px-6 md:px-16" style={{ contain: 'content' }}>
            <h2 className="text-2xl font-bold mb-6 text-white/90 tracking-tight">{title}</h2>

            <div className="relative group/scroll">
                <button
                    onClick={() => scroll('left')}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white text-white hover:text-black w-14 h-14 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl active:scale-90"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-8 snap-x px-4 -mx-4 scroll-smooth"
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
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-40 bg-white/10 hover:bg-white text-white hover:text-black w-14 h-14 rounded-full opacity-0 group-hover/scroll:opacity-100 transition-all backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-2xl active:scale-90"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
});

export default Row;
