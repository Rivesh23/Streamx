import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from '../api';
import Poster from './Poster';

interface RowProps {
    title: string;
    items: MediaItem[];
    onPosterClick: (item: MediaItem) => void;
    onPosterHover?: (item: MediaItem) => void;
}

export default function Row({ title, items, onPosterClick, onPosterHover }: RowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.clientWidth + 200 : current.clientWidth - 200;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-8 px-12 group/row relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">{title}</h2>

            <div className="group relative">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-20 bg-black/50 hover:bg-black/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity h-full flex items-center"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-scroll scrollbar-hide scroll-smooth pb-8 px-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                    className="absolute right-0 top-0 bottom-0 z-20 bg-black/50 hover:bg-black/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity h-full flex items-center"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
