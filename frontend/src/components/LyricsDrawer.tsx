import { useState, useEffect, useRef } from 'react';
import { X, Mic2, Loader2, Music2 } from 'lucide-react';
import { useAudio } from '../AudioContext';

interface LrcLine {
    time: number; // in seconds
    text: string;
}

// Parse LRC format string: [mm:ss.xx] Lyric text
function parseLrc(lrcContent: string): LrcLine[] {
    if (!lrcContent) return [];
    const lines = lrcContent.split('\n');
    const result: LrcLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const ms = parseInt(match[3], 10);
            const time = min * 60 + sec + (ms > 99 ? ms / 1000 : ms / 100);
            const text = line.replace(timeRegex, '').trim();
            if (text) {
                result.push({ time, text });
            }
        }
    }
    return result.sort((a, b) => a.time - b.time);
}

export default function LyricsDrawer({ onClose }: { onClose: () => void }) {
    const { currentTrack, currentTime, seekTo } = useAudio();
    const [lrcLines, setLrcLines] = useState<LrcLine[]>([]);
    const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const activeLineRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!currentTrack) return;
        let cancelled = false;
        setLoading(true);
        setError(false);
        setLrcLines([]);
        setPlainLyrics(null);

        const trackName = currentTrack.title;
        const artistName = currentTrack.artist;

        fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                if (cancelled) return;
                if (data.syncedLyrics) {
                    const parsed = parseLrc(data.syncedLyrics);
                    setLrcLines(parsed);
                } else if (data.plainLyrics) {
                    setPlainLyrics(data.plainLyrics);
                } else {
                    setError(true);
                }
            })
            .catch(() => {
                if (cancelled) return;
                // Fallback search endpoint
                fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${trackName} ${artistName}`)}`)
                    .then(res => res.json())
                    .then(list => {
                        if (cancelled || !Array.isArray(list) || list.length === 0) {
                            setError(true);
                            return;
                        }
                        const match = list.find((item: any) => item.syncedLyrics || item.plainLyrics) || list[0];
                        if (match.syncedLyrics) {
                            setLrcLines(parseLrc(match.syncedLyrics));
                        } else if (match.plainLyrics) {
                            setPlainLyrics(match.plainLyrics);
                        } else {
                            setError(true);
                        }
                    })
                    .catch(() => { if (!cancelled) setError(true); });
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [currentTrack]);

    // Calculate current active line index
    let activeIndex = -1;
    if (lrcLines.length > 0) {
        for (let i = 0; i < lrcLines.length; i++) {
            if (currentTime >= lrcLines[i].time) {
                activeIndex = i;
            } else {
                break;
            }
        }
    }

    // Auto-scroll active line into view smoothly
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeIndex]);

    if (!currentTrack) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(11, 13, 18, 0.97)', backdropFilter: 'blur(28px)',
            display: 'flex', flexDirection: 'column', padding: '32px 24px',
            color: 'var(--text)', userSelect: 'none'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-bg)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Mic2 size={22} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', lineHeight: 1.2 }}>
                            {currentTrack.title}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                            {currentTrack.artist} {lrcLines.length > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · Live Synced LRC</span>}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="btn-icon" style={{ width: 40, height: 40 }}>
                    <X size={22} />
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', maxWidth: 800, margin: '0 auto', width: '100%', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="scrollbar-hide">
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, margin: 'auto' }}>
                        <Loader2 size={36} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Fetching live synchronized lyrics…</p>
                    </div>
                )}

                {error && !loading && (
                    <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-3)' }}>
                        <Music2 size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>No lyrics available</p>
                        <p style={{ fontSize: 13, marginTop: 4 }}>We couldn't find lyrics for "{currentTrack.title}"</p>
                    </div>
                )}

                {/* Synced LRC Lyrics Karaoke View */}
                {lrcLines.length > 0 && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', padding: '120px 0' }}>
                        {lrcLines.map((line, idx) => {
                            const isActive = idx === activeIndex;
                            const isPast = idx < activeIndex;
                            return (
                                <p
                                    key={idx}
                                    ref={isActive ? activeLineRef : null}
                                    onClick={() => seekTo(line.time)}
                                    style={{
                                        fontSize: isActive ? 28 : isPast ? 20 : 20,
                                        fontWeight: isActive ? 900 : 600,
                                        color: isActive ? 'var(--accent)' : isPast ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
                                        textShadow: isActive ? '0 0 24px rgba(99, 102, 241, 0.6)' : 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        lineHeight: 1.4,
                                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                >
                                    {line.text}
                                </p>
                            );
                        })}
                    </div>
                )}

                {/* Plain Text Lyrics View */}
                {plainLyrics && lrcLines.length === 0 && !loading && (
                    <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: 17, lineHeight: 1.9, color: 'var(--text-2)', maxWidth: 600, margin: 'auto 0' }}>
                        {plainLyrics}
                    </div>
                )}
            </div>
        </div>
    );
}
