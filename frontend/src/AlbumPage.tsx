import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Disc3, Loader2 } from 'lucide-react';
import { audioApi, SaavnAlbumDetails } from './services/audioApi';
import { useAudio, Track } from './AudioContext';
import Navbar from './components/Navbar';

export default function AlbumPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { playTrack, playNow } = useAudio();

    const [album, setAlbum] = useState<SaavnAlbumDetails | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        audioApi.getAlbum(id).then(res => {
            if (res) {
                setAlbum(res.details);
                setTracks(res.tracks);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            playNow(tracks[0]);
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

    if (!album) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '100px 24px' }}>
                    <h2>Album Not Found</h2>
                    <button onClick={() => navigate('/audio')} className="btn btn-accent" style={{ marginTop: 16 }}>Return to Audio</button>
                </div>
            </div>
        );
    }

    const coverImg = album.image?.[album.image.length - 1]?.link || album.image?.[album.image.length - 1]?.url;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 100 }}>
            <Navbar />

            {/* Album Header */}
            <div style={{ padding: '40px 32px', background: 'linear-gradient(to bottom, rgba(99,102,241,0.12) 0%, transparent 100%)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                    {coverImg ? (
                        <img src={coverImg} alt={album.name} style={{ width: 180, height: 180, borderRadius: 16, objectFit: 'cover', boxShadow: 'var(--shadow-lg)' }} />
                    ) : (
                        <div style={{ width: 180, height: 180, borderRadius: 16, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Disc3 size={48} style={{ color: 'var(--text-3)' }} />
                        </div>
                    )}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Album</div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: '4px 0 8px' }}>{album.name}</h1>
                        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                            {album.artists?.map(a => a.name).join(', ')} {album.year ? `· ${album.year}` : ''} · {tracks.length} Tracks
                        </p>
                        <button onClick={handlePlayAll} className="btn btn-accent" style={{ marginTop: 20, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Play size={16} style={{ fill: '#fff' }} /> Play Album
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracklist */}
            <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tracks.map((track, i) => (
                        <div
                            key={track.id}
                            onClick={() => playTrack(track)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                                borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                        >
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)', width: 24 }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{track.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{track.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
