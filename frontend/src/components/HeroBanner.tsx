import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../api';

interface HeroBannerProps {
    items: MediaItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
    const navigate = useNavigate();
    const [idx, setIdx] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    const featured = items[idx];

    // Auto-rotate every 8 seconds
    useEffect(() => {
        if (items.length <= 1) return;
        const t = setInterval(() => advance(1), 8000);
        return () => clearInterval(t);
    }, [idx, items.length]);

    const advance = (dir: 1 | -1) => {
        if (transitioning) return;
        setTransitioning(true);
        setTimeout(() => {
            setIdx(i => (i + dir + items.length) % items.length);
            setTransitioning(false);
        }, 300);
    };

    if (!featured) return null;

    return (
        <div className="hero-container">
            {/* Backdrop */}
            <div style={{
                position: 'absolute', inset: 0,
                opacity: transitioning ? 0 : 1,
                transition: 'opacity 0.4s ease',
            }}>
                {featured.backdrop ? (
                    <img
                        src={featured.backdrop}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
                )}
            </div>

            {/* Gradients */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0.4) 55%, transparent 100%)',
                zIndex: 2,
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, var(--bg) 0%, transparent 40%)',
                zIndex: 2,
            }} />

            {/* Content */}
            <div className="hero-content" style={{
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
                {/* Type badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    marginBottom: 14, padding: '4px 12px',
                    background: 'var(--accent-bg)', borderRadius: 999,
                    border: '1px solid var(--border-glow)',
                    fontSize: 10, fontWeight: 900, color: 'var(--accent)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                    {featured.type === 'tv' ? '📺 TV Series' : '🎬 Feature Film'}
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: 'clamp(24px, 4vw, 54px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: '#F8FAFC',
                    lineHeight: 1.05,
                    marginBottom: 12,
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}>
                    {featured.title}
                </h2>

                {/* Overview */}
                {featured.overview && (
                    <p style={{
                        fontSize: 14,
                        color: 'var(--text-2)',
                        lineHeight: 1.65,
                        marginBottom: 24,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {featured.overview}
                    </p>
                )}

                {/* Buttons */}
                <div className="hero-buttons">
                    <button
                        onClick={() => navigate(`/${featured.type}/${featured.tmdb_id}`)}
                        className="btn btn-accent btn-lg"
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Play size={17} style={{ fill: 'currentColor' }} />
                        Watch Now
                    </button>
                    <button
                        onClick={() => navigate(`/${featured.type}/${featured.tmdb_id}`)}
                        className="btn btn-ghost btn-lg"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.08)', color: '#fff',
                            border: '1px solid var(--border-2)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Info size={16} /> More Info
                    </button>
                </div>
            </div>

            {/* Indicator Dots + Arrows */}
            {items.length > 1 && (
                <div style={{
                    position: 'absolute', bottom: 24, right: 32,
                    zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <button onClick={() => advance(-1)} className="btn-icon" style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {items.slice(0, 7).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                style={{
                                    width: i === idx ? 22 : 6, height: 6,
                                    borderRadius: 999,
                                    background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                                    border: 'none', cursor: 'pointer',
                                    transition: 'width 0.3s, background 0.3s',
                                    boxShadow: i === idx ? '0 0 10px rgba(99,102,241,0.5)' : 'none'
                                }}
                            />
                        ))}
                    </div>
                    <button onClick={() => advance(1)} className="btn-icon" style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
