import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle, ArrowLeft, Music2, Disc3, UserCheck, Loader2 } from 'lucide-react';
import { audioApi, SaavnArtistDetails } from './services/audioApi';
import { useAudio, Track } from './AudioContext';
import Navbar from './components/Navbar';

export default function ArtistPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playTrack, playNow } = useAudio();

    const [artist, setArtist] = useState<SaavnArtistDetails | null>(null);
    const [topTracks, setTopTracks] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        audioApi.getArtist(id).then(res => {
            if (res) {
                setArtist(res.details);
                setTopTracks(res.topTracks);
                setAlbums(res.topAlbums);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const handlePlayAll = () => {
        if (topTracks.length > 0) {
            playNow(topTracks[0]);
        }
    };

    const handleShuffle = () => {
        if (topTracks.length > 0) {
            const randomTrack = topTracks[Math.floor(Math.random() * topTracks.length)];
            playNow(randomTrack);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
                    <Loader2 size={40} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '100px 24px' }}>
                    <h2>Artist Not Found</h2>
                    <button onClick={() => navigate('/audio')} className="btn btn-accent" style={{ marginTop: 16 }}>Return to Audio</button>
                </div>
            </div>
        );
    }

    const heroImg = artist.image?.[artist.image.length - 1]?.link || artist.image?.[artist.image.length - 1]?.url;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 100 }}>
            <Navbar />

            {/* Artist Hero Header */}
            <div style={{ position: 'relative', height: 320, background: 'var(--surface-elevated)', overflow: 'hidden' }}>
                {heroImg ? (
                    <img src={heroImg} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E1B4B, #0F172A)' }} />
                )}

                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, transparent 80%)' }} />

                <div style={{ position: 'absolute', bottom: 24, left: 32, right: 32, display: 'flex', alignItems: 'flex-end', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
                    {heroImg && (
                        <img src={heroImg} alt={artist.name} style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-glow)', boxShadow: 'var(--shadow-lg)' }} />
                    )}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Verified Artist</div>
                        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.02em' }}>{artist.name}</h1>
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button onClick={handlePlayAll} className="btn btn-accent" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Play size={16} style={{ fill: '#fff' }} /> Play All
                            </button>
                            <button onClick={handleShuffle} className="btn btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shuffle size={16} /> Shuffle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 32px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>Popular Songs</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topTracks.map((track, i) => (
                        <div
                            key={track.id}
                            onClick={() => playTrack(track)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
                                borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                        >
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)', width: 20 }}>{i + 1}</span>
                            <img src={track.artworkUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{track.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{track.album}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
