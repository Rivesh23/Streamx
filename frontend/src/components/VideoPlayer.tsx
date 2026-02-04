import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize, Settings, SkipForward, ArrowLeft, Volume2, Sun } from 'lucide-react';
import { MediaItem, api } from '../api';
import CustomDropdown from './CustomDropdown';

interface VideoPlayerProps {
    item: MediaItem;
    onClose: () => void;
}

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
    const [source, setSource] = useState('vidking');
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [volume, setVolume] = useState(100);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [episodesCount, setEpisodesCount] = useState(1);

    let timeout: any;

    useEffect(() => {
        if (item.type === 'tv') {
            api.getTVDetails(item.tmdb_id).then(data => {
                if (data.seasons) {
                    const filtered = data.seasons.filter((s: any) => s.season_number > 0);
                    setSeasons(filtered);
                    if (filtered.length > 0) {
                        setEpisodesCount(filtered[0].episode_count);
                    }
                }
            });
        }
    }, [item.tmdb_id, item.type]);

    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);

        // NEW: Progress Heartbeat (Every 15 seconds)
        // Since we can't get exact time from iframe, we track "time spent active"
        let startTime = Date.now();
        const heartbeat = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            // Send progress update. For iframes, we just increment a "time" counter
            // We'll use 0.1 as a placeholder for "still watching"
            api.saveProgress(item.tmdb_id, elapsed, false, item.type, item.title);
        }, 15000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(heartbeat);
        };
    }, [item.tmdb_id, item.type, item.title]);

    const getEmbedUrl = () => {
        const id = item.tmdb_id;
        const s = season;
        const e = episode;

        switch (source) {
            case 'vidsrc':
                return item.type === 'movie'
                    ? `https://vidsrc.me/embed/movie?tmdb=${id}`
                    : `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`;
            case 'vidsrc_to':
                return item.type === 'movie'
                    ? `https://vidsrc.to/embed/movie/${id}`
                    : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
            case 'superembed':
                return item.type === 'movie'
                    ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
                    : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
            case '2embed':
                return item.type === 'movie'
                    ? `https://www.2embed.cc/embed/${id}`
                    : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
            case 'vidking':
            default:
                return item.type === 'movie'
                    ? `https://vidbinge.com/embed/movie/${id}`
                    : `https://vidbinge.com/embed/tv/${id}/${s}/${e}`;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
            {/* Brightness Overlay */}
            <div
                className="absolute inset-0 z-50 pointer-events-none bg-black transition-opacity duration-300"
                style={{ opacity: (100 - brightness) / 100 }}
            />

            <iframe
                src={getEmbedUrl()}
                className="w-full h-full border-none"
                allowFullScreen
            />

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 w-full p-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-3 text-white/70 hover:text-white transition-all group"
                            >
                                <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                                <span className="font-bold text-lg">Back to Browse</span>
                            </button>

                            <div className="flex flex-col items-center">
                                <h2 className="text-xl font-black tracking-tight">{item.title}</h2>
                                <div className="flex gap-4 text-xs font-bold text-white/40 uppercase mt-1">
                                    <span>{item.type}</span>
                                    <span>•</span>
                                    <span>HD 5.1</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {item.type === 'tv' && (
                                    <div className="flex items-center gap-2">
                                        <CustomDropdown
                                            options={seasons.map(s => ({
                                                value: s.season_number,
                                                label: `Season ${s.season_number}`
                                            }))}
                                            value={season}
                                            onChange={(val) => {
                                                const sNum = parseInt(val);
                                                setSeason(sNum);
                                                const s = seasons.find(s => s.season_number === sNum);
                                                if (s) setEpisodesCount(s.episode_count);
                                                setEpisode(1);
                                            }}
                                        />

                                        <CustomDropdown
                                            options={Array.from({ length: episodesCount }, (_, i) => ({
                                                value: i + 1,
                                                label: `Episode ${i + 1}`
                                            }))}
                                            value={episode}
                                            onChange={(val) => setEpisode(parseInt(val))}
                                        />
                                    </div>
                                )}

                                <CustomDropdown
                                    options={[
                                        { value: 'vidking', label: 'VidKing (Recommended)' },
                                        { value: 'vidsrc', label: 'VidSrc Multi' },
                                        { value: 'vidsrc_to', label: 'VidSrc PRO' },
                                        { value: '2embed', label: '2Embed' },
                                        { value: 'superembed', label: 'SuperEmbed' },
                                    ]}
                                    value={source}
                                    onChange={setSource}
                                    className="min-w-[200px]"
                                />

                                <div className="relative">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`p-3 rounded-full transition-all ${showSettings ? 'bg-brand text-white shadow-apple-focus' : 'hover:bg-white/10 text-white/70'}`}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>

                                    <AnimatePresence>
                                        {showSettings && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 5 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute right-0 top-full z-[300] w-64 liquid-blur border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                                        <div className="flex items-center gap-2">
                                                            <Sun className="w-3 h-3" /> Brightness
                                                        </div>
                                                        <span>{brightness}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="100"
                                                        value={brightness}
                                                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                                                        className="w-full accent-brand h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                                        <div className="flex items-center gap-2">
                                                            <Volume2 className="w-3 h-3" /> Volume
                                                        </div>
                                                        <span>{volume}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={volume}
                                                        onChange={(e) => setVolume(parseInt(e.target.value))}
                                                        className="w-full accent-brand h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                                                    />
                                                </div>

                                                <div className="pt-2 border-t border-white/5 space-y-2">
                                                    <button className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                                        Playback Speed: 1.0x
                                                    </button>
                                                    <button className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                                        Report an Issue
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Gradient for future controls */}
                        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
