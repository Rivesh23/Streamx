import { MediaItem } from '../api';
import MediaCard from './Poster';
import { ChevronRight } from 'lucide-react';

interface RowProps {
    title: string;
    items: MediaItem[];
    onSeeAll?: () => void;
}

export default function Row({ title, items, onSeeAll }: RowProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="home-section">
            <div className="home-section-header">
                <h2 className="home-section-title">{title}</h2>
                {onSeeAll && (
                    <button
                        onClick={onSeeAll}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
                            transition: 'color 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
                    >
                        See all <ChevronRight size={14} />
                    </button>
                )}
            </div>
            <div className="section-row scrollbar-hide">
                {items.map(item => (
                    <MediaCard key={item.tmdb_id} item={item} />
                ))}
            </div>
        </div>
    );
}
