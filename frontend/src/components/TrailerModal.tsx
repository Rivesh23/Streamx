import { useEffect } from 'react';
import { X, Youtube } from 'lucide-react';

interface TrailerModalProps {
    trailerKey: string;
    title: string;
    onClose: () => void;
}

export default function TrailerModal({ trailerKey, title, onClose }: TrailerModalProps) {
    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const embedUrl = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(11, 13, 18, 0.88)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px', animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 960,
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-glow)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-cinematic)',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Modal Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Youtube size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                                {title}
                            </h3>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Official Trailer</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="btn-icon"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Video Player iFrame Container (16:9 Aspect Ratio) */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                    <iframe
                        src={embedUrl}
                        title={`${title} Trailer`}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            border: 'none'
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}
