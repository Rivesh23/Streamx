import { useNavigate } from 'react-router-dom';
import { Play, Film, Tv } from 'lucide-react';
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
                    background: 'var(--surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-3)',
                }}>
                    <Play size={28} />
                </div>
            )}

            {/* Hover overlay with Play Button icon */}
            <div className="media-card-overlay">
                <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)'
                }}>
                    <Play size={18} style={{ fill: '#fff', marginLeft: 2 }} />
                </div>
                <span className="media-card-title" style={{ textAlign: 'center' }}>{item.title}</span>
            </div>

            {/* Progress bar */}
            {item.progress && item.progress > 0 && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(item.progress * 100, 100)}%` }}
                    />
                </div>
            )}

            {/* Label below */}
            {showLabel && (
                <div className="media-card-label">
                    <div className="media-card-label-title">{item.title}</div>
                    <div className="media-card-label-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {item.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                        <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
