import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Server, ChevronDown, SkipForward } from 'lucide-react';
import { MediaItem, api } from '../api';
import { preloadMap } from '../preloader';

interface PhonePlayerProps {
    item: MediaItem;
    onClose: () => void;
}

export default function PhonePlayer({ item, onClose }: PhonePlayerProps) {
    const [source, setSource] = useState('2embed');
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [episodesCount, setEpisodesCount] = useState(10);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [showSourcePicker, setShowSourcePicker] = useState(false);
    const [showEpisodePicker, setShowEpisodePicker] = useState(false);
    const iframeContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (item.type === 'tv') {
            api.getTVDetails(item.tmdb_id).then((data: any) => {
                if (data.seasons) {
                    const filtered = data.seasons.filter((s: any) => s.season_number > 0);
                    setSeasons(filtered);
                    if (filtered.length > 0) {
                        setEpisodesCount(filtered[0].episode_count);
                    }
                }
            }).catch(console.error);
        }
    }, [item.tmdb_id, item.type]);

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
                    ? `https://vidlink.pro/movie/${id}?primaryColor=E50914&autoplay=false`
                    : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=E50914&autoplay=false`;
        }
    };

    useEffect(() => {
        if (!item.is_local && iframeContainerRef.current) {
            const url = getEmbedUrl();
            // Clear previous iframe
            while (iframeContainerRef.current.firstChild) {
                iframeContainerRef.current.removeChild(iframeContainerRef.current.firstChild);
            }

            let iframe = preloadMap.get(item.tmdb_id);
            if (iframe) {
                if (iframe.src !== url) iframe.src = url;
                iframe.style.display = "block";
                iframe.className = "w-full h-full border-none";
                iframeContainerRef.current.appendChild(iframe);
            } else {
                iframe = document.createElement("iframe");
                iframe.src = url;
                iframe.className = "w-full h-full border-none";
                iframe.allowFullscreen = true;
                iframeContainerRef.current.appendChild(iframe);
            }

            return () => {
                if (iframe && iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                    iframe.style.display = "none";
                    document.body.appendChild(iframe);
                    preloadMap.set(item.tmdb_id, iframe);
                }
            };
        }
    }, [item.tmdb_id, season, episode, source]);

    const SOURCES = [
        { value: '2embed', label: '2Embed' },
        { value: 'vidking', label: 'VidLink' },
        { value: 'vidsrc', label: 'VidSrc' },
        { value: 'vidsrc_to', label: 'VidSrc PRO' },
        { value: 'superembed', label: 'SuperEmbed' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black flex flex-col"
        >
            {/* Top controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md z-20">
                <button onClick={onClose} className="text-white p-1">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 mx-4 truncate">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    {item.type === 'tv' && (
                        <p className="text-xs text-white/40">S{season} E{episode}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Source picker */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowSourcePicker(!showSourcePicker); setShowEpisodePicker(false); }}
                            className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                            <Server className="w-3 h-3" />
                            {SOURCES.find(s => s.value === source)?.label}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSourcePicker && (
                            <div className="absolute top-full right-0 mt-2 bg-[#1c1c1e] rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[140px] z-30">
                                {SOURCES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => { setSource(s.value); setShowSourcePicker(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-medium ${source === s.value ? 'text-[#E50914] bg-white/5' : 'text-white/70'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Episode picker for TV */}
                    {item.type === 'tv' && (
                        <div className="relative">
                            <button
                                onClick={() => { setShowEpisodePicker(!showEpisodePicker); setShowSourcePicker(false); }}
                                className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                                S{season} E{episode}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showEpisodePicker && (
                                <div className="absolute top-full right-0 mt-2 bg-[#1c1c1e] rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[160px] max-h-60 overflow-y-auto z-30" style={{ scrollbarWidth: 'none' }}>
                                    {seasons.map(s => (
                                        <div key={s.season_number}>
                                            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-white/30 font-black bg-white/5">
                                                Season {s.season_number}
                                            </div>
                                            {Array.from({ length: s.episode_count }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setSeason(s.season_number);
                                                        setEpisode(i + 1);
                                                        setEpisodesCount(s.episode_count);
                                                        setShowEpisodePicker(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs font-medium ${season === s.season_number && episode === i + 1 ? 'text-[#E50914] bg-white/5' : 'text-white/70'}`}
                                                >
                                                    Episode {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 bg-black relative">
                {item.is_local ? (
                    <video
                        ref={videoRef}
                        src={`http://localhost:8000/api/stream/${item.tmdb_id}`}
                        className="w-full h-full object-contain"
                        autoPlay
                        controls
                        playsInline
                    />
                ) : (
                    <div ref={iframeContainerRef} className="w-full h-full" />
                )}
            </div>

            {/* Next episode button for TV shows */}
            {item.type === 'tv' && (
                <div className="flex items-center justify-center gap-3 py-3 bg-black/80 backdrop-blur-md">
                    <button
                        onClick={() => {
                            if (episode < episodesCount) {
                                setEpisode(e => e + 1);
                            } else {
                                const next = seasons.find(s => s.season_number === season + 1);
                                if (next) {
                                    setSeason(season + 1);
                                    setEpisodesCount(next.episode_count);
                                    setEpisode(1);
                                }
                            }
                        }}
                        className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    >
                        <SkipForward className="w-4 h-4" />
                        Next Episode
                    </button>
                </div>
            )}
        </motion.div>
    );
}
