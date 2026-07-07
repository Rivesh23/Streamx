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
        <div style={{
            position: 'relative',
            height: 520,
            overflow: 'hidden',
            background: 'var(--surface)',
            marginBottom: 36,
        }}>
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
                background: 'linear-gradient(to right, rgba(12,12,14,0.92) 0%, rgba(12,12,14,0.4) 55%, transparent 100%)',
                zIndex: 2,
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, var(--bg) 0%, transparent 40%)',
                zIndex: 2,
            }} />

            {/* Content */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0,
                zIndex: 5,
                padding: '0 32px 40px',
                maxWidth: 560,
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
                {/* Type badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    marginBottom: 14, padding: '4px 10px',
                    background: 'var(--accent)', borderRadius: 999,
                    fontSize: 10, fontWeight: 900, color: '#000',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                    {featured.type === 'tv' ? '📺 TV Show' : '🎬 Movie'}
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: 'clamp(28px, 4vw, 48px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: '#fff',
                    lineHeight: 1.05,
                    marginBottom: 12,
                    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}>
                    {featured.title}
                </h2>

                {/* Overview */}
                {featured.overview && (
                    <p style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.65)',
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
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => navigate(`/${featured.type}/${featured.tmdb_id}`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 12,
                            fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            background: 'var(--accent)', color: '#000', border: 'none',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(48,209,88,0.4)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.transform = 'none';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                    >
                        <Play size={16} style={{ fill: 'currentColor' }} />
                        Watch Now
                    </button>
                    <button
                        onClick={() => navigate(`/${featured.type}/${featured.tmdb_id}`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 20px', borderRadius: 12,
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.12)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Info size={15} /> More Info
                    </button>
                </div>
            </div>

            {/* Dot indicators + arrows */}
            {items.length > 1 && (
                <div style={{
                    position: 'absolute', bottom: 20, right: 28,
                    zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <button onClick={() => advance(-1)} style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', gap: 5 }}>
                        {items.slice(0, 7).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                style={{
                                    width: i === idx ? 20 : 6, height: 6,
                                    borderRadius: 999,
                                    background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                                    border: 'none', cursor: 'pointer',
                                    transition: 'width 0.3s, background 0.3s',
                                }}
                            />
                        ))}
                    </div>
                    <button onClick={() => advance(1)} style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
