import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { MediaItem } from '../api';

interface MediaCardProps {
    item: MediaItem;
    showLabel?: boolean;
}

export default function MediaCard({ item, showLabel = false }: MediaCardProps) {
    const navigate = useNavigate();
    const imgSrc = item.poster;
    const handleClick = () => navigate(`/${item.type}/${item.tmdb_id}`);

    return (
        <div
            className="media-card-portrait"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
            aria-label={`View ${item.title}`}
        >
            {imgSrc ? (
                <img src={imgSrc} alt={item.title} loading="lazy" />
            ) : (
                <div style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-3)',
                }}>
                    <Play size={28} />
                </div>
            )}

            {/* Hover overlay */}
            <div className="media-card-overlay">
                <span className="media-card-title">{item.title}</span>
            </div>

            {/* Progress bar */}
            {item.progress && item.progress > 0 && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min((item.progress / 7200) * 100, 100)}%` }}
                    />
                </div>
            )}

            {/* Optional label below */}
            {showLabel && (
                <div className="media-card-label">
                    <div className="media-card-label-title">{item.title}</div>
                    <div className="media-card-label-meta">{item.type === 'movie' ? 'Movie' : 'TV Show'}</div>
                </div>
            )}
        </div>
    );
}
