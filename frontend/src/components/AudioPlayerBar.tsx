import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1, Shuffle, Download, Mic2, Sliders, Disc3, X, Loader2, Youtube } from 'lucide-react';
import { useAudio, EQPreset } from '../AudioContext';
import LyricsDrawer from './LyricsDrawer';

function SpectrumVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const bufferLength = analyser ? analyser.frequencyBinCount : 32;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animId = requestAnimationFrame(render);
            if (analyser) {
                analyser.getByteFrequencyData(dataArray);
            } else {
                dataArray.fill(0);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = analyser ? (dataArray[i] / 255) * canvas.height : 2;

                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#6366F1');
                gradient.addColorStop(1, '#A78BFA');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [analyser]);

    return (
        <canvas
            ref={canvasRef}
            width={80}
            height={24}
            style={{ borderRadius: 4, opacity: analyser ? 0.9 : 0.4 }}
        />
    );
}

function EQModal({ onClose }: { onClose: () => void }) {
    const { eqPreset, setEqPreset } = useAudio();
    const presets: EQPreset[] = ['Flat', 'Bass Boost', 'Vocal', 'Treble Boost', 'Electronic'];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(11,13,18,0.85)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
            <div style={{
                background: 'var(--surface-elevated)', border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-lg)', padding: 24, maxWidth: 380, width: '100%',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sliders size={18} style={{ color: 'var(--accent)' }} />
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC' }}>Web Audio Equalizer</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }}><X size={16} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {presets.map(p => (
                        <button
                            key={p}
                            onClick={() => setEqPreset(p)}
                            style={{
                                padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                background: eqPreset === p ? 'var(--accent-bg)' : 'var(--surface-2)',
                                border: `1.5px solid ${eqPreset === p ? 'var(--accent)' : 'var(--border)'}`,
                                color: eqPreset === p ? 'var(--accent)' : 'var(--text)',
                                fontSize: 14, fontWeight: 700, transition: 'all 0.15s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}
                        >
                            <span>{p}</span>
                            {eqPreset === p && <span className="badge badge-indigo" style={{ fontSize: 10 }}>Active</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function fmtTime(s: number) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayerBar() {
    const {
        currentTrack, isPlaying, currentTime, duration, volume,
        repeat, shuffle, analyserNode, showLyricsDrawer, loadingStream,
        togglePlay, playNext, playPrev, seekTo, setVolume,
        toggleRepeat, toggleShuffle, setShowLyricsDrawer
    } = useAudio();

    const [showEQ, setShowEQ] = useState(false);

    if (!currentTrack) return null;

    const progress = duration > 0 ? currentTime / duration : 0;

    const handleDownload = () => {
        const streamUrl = currentTrack.downloadUrl || currentTrack.previewUrl;
        if (!streamUrl) return;
        fetch(streamUrl)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(() => {
                window.open(streamUrl, '_blank');
            });
    };

    return (
        <>
            <div className="audio-player-bar">
                {/* Interactive Seek Bar */}
                <div
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, cursor: 'pointer', background: 'var(--surface-3)' }}
                    onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        seekTo(((e.clientX - rect.left) / rect.width) * duration);
                    }}
                >
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', borderRadius: 999, transition: 'width 0.2s linear' }} />
                </div>

                {/* Track Info */}
                <div className="audio-player-track-info">
                    <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-3)', flexShrink: 0, position: 'relative' }}>
                        {currentTrack.artworkUrl ? (
                            <img src={currentTrack.artworkUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Disc3 size={18} style={{ color: 'var(--text-3)' }} /></div>
                        )}
                        {loadingStream && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                            </div>
                        )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{currentTrack.title}</span>
                            {currentTrack.isYouTube && <Youtube size={12} style={{ color: '#F87171', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentTrack.artist}
                        </div>
                    </div>
                </div>

                {/* Controls (Center) */}
                <div className="audio-player-controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={toggleShuffle} title="Shuffle" style={{ background: 'none', border: 'none', cursor: 'pointer', color: shuffle ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.15s' }}>
                            <Shuffle size={16} />
                        </button>
                        <button onClick={playPrev} title="Previous" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
                            <SkipBack size={20} />
                        </button>
                        <button
                            onClick={togglePlay}
                            disabled={loadingStream}
                            style={{
                                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(99,102,241,0.5)', transition: 'transform 0.15s',
                                opacity: loadingStream ? 0.7 : 1, flexShrink: 0
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {loadingStream ? (
                                <Loader2 size={18} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                            ) : isPlaying ? (
                                <Pause size={18} style={{ fill: '#fff' }} />
                            ) : (
                                <Play size={18} style={{ fill: '#fff', marginLeft: 2 }} />
                            )}
                        </button>
                        <button onClick={playNext} title="Next" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
                            <SkipForward size={20} />
                        </button>
                        <button onClick={toggleRepeat} title="Repeat" style={{ background: 'none', border: 'none', cursor: 'pointer', color: repeat !== 'none' ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.15s' }}>
                            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                        </button>
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
                        <span>{fmtTime(currentTime)}</span> / <span>{fmtTime(duration)}</span>
                    </div>
                </div>

                {/* Right Side Tools */}
                <div className="audio-player-tools">
                    <SpectrumVisualizer analyser={analyserNode} />

                    <button
                        onClick={() => setShowEQ(true)}
                        title="Equalizer DSP"
                        style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}
                    >
                        <Sliders size={15} />
                    </button>

                    <button
                        onClick={() => setShowLyricsDrawer(v => !v)}
                        title="Karaoke Synced Lyrics"
                        style={{ padding: 6, borderRadius: 8, background: showLyricsDrawer ? 'var(--accent-bg)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showLyricsDrawer ? 'var(--accent)' : 'var(--border)'}`, color: showLyricsDrawer ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', display: 'flex' }}
                    >
                        <Mic2 size={15} />
                    </button>

                    <button
                        onClick={handleDownload}
                        title="Download MP3"
                        style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}
                    >
                        <Download size={15} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                        <button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <input
                            type="range" min={0} max={1} step={0.02} value={volume}
                            onChange={e => setVolume(Number(e.target.value))}
                            style={{ width: 70, accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>

            {/* Lyrics Drawer Modal */}
            {showLyricsDrawer && <LyricsDrawer onClose={() => setShowLyricsDrawer(false)} />}

            {/* EQ Preset Modal */}
            {showEQ && <EQModal onClose={() => setShowEQ(false)} />}
        </>
    );
}
