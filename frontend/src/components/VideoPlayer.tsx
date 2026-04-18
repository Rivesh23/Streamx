import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize, Settings, SkipForward, ArrowLeft, Volume2, Sun, Play, FastForward, Sparkles, Tv2, Users, MessageCircle, Heart, Send } from 'lucide-react';
import { MediaItem, api } from '../api';
import CustomDropdown from './CustomDropdown';
import { preloadMap } from '../preloader';

interface VideoPlayerProps {
    item: MediaItem;
    onClose: () => void;
    defaultWatchParty?: boolean;
}

export default function VideoPlayer({ item, onClose, defaultWatchParty = false }: VideoPlayerProps) {
    const [source, setSource] = useState('2embed');
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [volume, setVolume] = useState(100);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [episodesCount, setEpisodesCount] = useState(1);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [ambientGlow, setAmbientGlow] = useState(true);
    const [isWatchParty, setIsWatchParty] = useState(defaultWatchParty);
    const [chatMessages, setChatMessages] = useState<{user: string, text: string, time: string}[]>([
        { user: 'Alex', text: 'C\'est parti ! 🍿', time: '12:01' },
        { user: 'Sarah', text: 'J\'attendais ce film depuis des mois !!', time: '12:02' }
    ]);
    const [smartResume, setSmartResume] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => setSmartResume(false), 5000);
    }, []);

    useEffect(() => {
        if (!isWatchParty) return;
        const interval = setInterval(() => {
            const fakeMsgs = ['Wow 😱', 'Haha énorme', 'Attends quoi ?!', 'Meilleure scène 🔥', 'J\'adore la musique ici', 'Oof 😬'];
            const users = ['Alex', 'Sarah', 'Marc', 'Léa', 'Tom'];
            const d = new Date();
            setChatMessages(prev => [...prev, {
                user: users[Math.floor(Math.random() * users.length)],
                text: fakeMsgs[Math.floor(Math.random() * fakeMsgs.length)],
                time: `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
            }].slice(-10));
        }, 5000);
        return () => clearInterval(interval);
    }, [isWatchParty]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeContainerRef = useRef<HTMLDivElement>(null);
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
        if (videoRef.current) {
            videoRef.current.volume = volume / 100;
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [volume, playbackSpeed]);

    useEffect(() => {
        document.title = `Watching: ${item.title}`;
        return () => { document.title = 'Aethernex'; };
    }, [item.title]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!videoRef.current) return;
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (videoRef.current.paused) videoRef.current.play();
                    else videoRef.current.pause();
                    break;
                case 'arrowright':
                    videoRef.current.currentTime += 10;
                    break;
                case 'arrowleft':
                    videoRef.current.currentTime -= 10;
                    break;
                case 'm':
                    setVolume(v => v === 0 ? 100 : 0);
                    break;
                case 'f':
                    if (document.fullscreenElement) document.exitFullscreen();
                    else document.documentElement.requestFullscreen();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Progress Heartbeat (Every 15 seconds)
        let startTime = Date.now();
        const heartbeat = setInterval(() => {
            if (item.is_local && videoRef.current) {
                // Real timestamp tracking
                const currentTime = videoRef.current.currentTime;
                api.saveProgress(item.tmdb_id, currentTime, false, item.type, item.title);
            } else {
                // Iframe tracking fallback (time spent on page)
                const elapsed = (Date.now() - startTime) / 1000;
                api.saveProgress(item.tmdb_id, elapsed, false, item.type, item.title);
            }
        }, 15000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(heartbeat);
        };
    }, [item]);

    // Log to watch history on mount
    useEffect(() => {
        api.logWatch(item, 0).catch(console.error);
    }, [item]);

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
            let iframe = preloadMap.get(item.tmdb_id);
            
            if (iframe) {
                if (iframe.src !== url) iframe.src = url;
                iframe.style.display = "block";
                iframe.className = "w-full h-full border-none bg-black";
                iframeContainerRef.current.appendChild(iframe);
            } else {
                iframe = document.createElement("iframe");
                iframe.src = url;
                iframe.className = "w-full h-full border-none bg-black";
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

    const handleSkipIntro = () => {
        if (videoRef.current) {
            videoRef.current.currentTime += 85;
        }
    };

    const handleNextEpisode = () => {
        if (episode < episodesCount) {
            setEpisode(e => e + 1);
        } else {
            // Next Season
            const nextSeason = season + 1;
            const s = seasons.find(s => s.season_number === nextSeason);
            if (s) {
                setSeason(nextSeason);
                setEpisodesCount(s.episode_count);
                setEpisode(1);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
            {/* Brightness Overlay */}
            <div
                className="absolute inset-0 z-50 pointer-events-none bg-black transition-opacity duration-300"
                style={{ opacity: (100 - brightness) / 100 }}
            />

            {/* Ambient Glow */}
            {ambientGlow && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-50 blur-[100px] bg-gradient-to-br from-brand/20 via-transparent to-blue-900/20" />
            )}

            <div className="relative w-full h-full z-10 bg-black">
                {item.is_local ? (
                    <video
                        ref={videoRef}
                        src={`http://localhost:8000/api/stream/${item.tmdb_id}`}
                        className="w-full h-full object-contain"
                        autoPlay
                        controls={false}
                    />
                ) : (
                    <div ref={iframeContainerRef} className="w-full h-full" />
                )}
            </div>

            {/* Mouse Event Catcher: Active only when controls are hidden so we can detect mouse move over the iframe */}
            {!showControls && (
                <div 
                    className="absolute inset-0 z-[250]"
                    onMouseMove={() => setShowControls(true)}
                />
            )}

            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-[300] pointer-events-none flex flex-col justify-between"
                    >
                        {/* Top Bar - Netflix Style (Contains all custom controls for iframes) */}
                        <div className="w-full p-6 md:p-8 bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-auto flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={onClose}
                                    className="text-white hover:text-gray-300 transition-colors p-2"
                                >
                                    <ArrowLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
                                </button>
                                
                                {/* Title always visible in top bar for iframes, or just back arrow for local */}
                                {!item.is_local && (
                                    <div className="flex flex-col">
                                        <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md">{item.title}</h2>
                                        {item.type === 'tv' && (
                                            <span className="text-sm font-medium text-gray-300">Season {season} Episode {episode}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Controls moved to top bar for iframes */}
                            {!item.is_local && (
                                <div className="flex items-center gap-6">
                                    {item.type === 'tv' && (
                                        <div className="flex items-center gap-4 text-white bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                                            <CustomDropdown
                                                options={seasons.map(s => ({ value: s.season_number, label: `S${s.season_number}` }))}
                                                value={season}
                                                onChange={(val) => {
                                                    const sNum = parseInt(val);
                                                    setSeason(sNum);
                                                    const s = seasons.find(s => s.season_number === sNum);
                                                    if (s) setEpisodesCount(s.episode_count);
                                                    setEpisode(1);
                                                }}
                                                className="min-w-[80px] text-base font-medium bg-transparent border-none hover:text-gray-300"
                                                direction="down"
                                            />
                                            <CustomDropdown
                                                options={Array.from({ length: episodesCount }, (_, i) => ({ value: i + 1, label: `Ep ${i + 1}` }))}
                                                value={episode}
                                                onChange={(val) => setEpisode(parseInt(val))}
                                                className="min-w-[80px] text-base font-medium bg-transparent border-none hover:text-gray-300"
                                                direction="down"
                                            />
                                            <button 
                                                onClick={handleNextEpisode}
                                                className="text-white hover:text-gray-300 transition-colors"
                                                title="Next Episode"
                                            >
                                                <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                                        <CustomDropdown
                                            options={[
                                                { value: '2embed', label: '2Embed' },
                                                { value: 'vidking', label: 'VidLink' },
                                                { value: 'vidsrc', label: 'VidSrc' },
                                                { value: 'vidsrc_to', label: 'VidSrc PRO' },
                                                { value: 'superembed', label: 'SuperEmbed' },
                                            ]}
                                            value={source}
                                            onChange={setSource}
                                            className="min-w-[100px] text-base font-medium bg-transparent border-none hover:text-gray-300 text-white"
                                            direction="down"
                                        />

                                        <button
                                            onClick={() => setIsWatchParty(!isWatchParty)}
                                            className={`hover:scale-110 transition-transform ${isWatchParty ? 'text-[#E50914]' : 'text-white hover:text-gray-300'}`}
                                            title="Watch Party"
                                        >
                                            <Users className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSettings(!showSettings)}
                                                className="text-white hover:scale-110 hover:text-gray-300 transition-transform flex items-center"
                                                title="Settings"
                                            >
                                                <Settings className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>

                                            <AnimatePresence>
                                                {showSettings && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                        className="absolute top-full right-0 mt-6 z-[300] w-72 bg-black/90 backdrop-blur-3xl rounded-lg p-6 shadow-2xl space-y-6 border border-white/10"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                                <div className="flex items-center gap-2"><Sun className="w-4 h-4" /> Brightness</div>
                                                                <span>{brightness}%</span>
                                                            </div>
                                                            <input type="range" min="10" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-[#E50914] h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer" />
                                                        </div>

                                                        <div className="pt-4 border-t border-white/10 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-300"><Sparkles className="w-4 h-4" /> Ambient Glow</div>
                                                                <button onClick={() => setAmbientGlow(!ambientGlow)} className={`w-12 h-6 rounded-full relative transition-colors ${ambientGlow ? 'bg-[#E50914]' : 'bg-white/30'}`}>
                                                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${ambientGlow ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Bar - Only visible for Local Media since Iframes have their own bottom bar */}
                        {item.is_local && (
                            <div className="w-full pt-32 pb-6 px-6 md:px-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto flex flex-col justify-end">
                                
                                {/* Title - Netflix places it right above timeline */}
                                <div className="flex items-end gap-4 mb-4">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{item.title}</h2>
                                    {item.type === 'tv' && (
                                        <span className="text-sm font-medium text-gray-300 pb-1">S{season}:E{episode}</span>
                                    )}
                                </div>

                                {/* Netflix Timeline */}
                                <div className="w-full group mb-4 cursor-pointer relative flex items-center h-4">
                                    <div className="absolute left-0 right-0 h-[3px] bg-white/20 transition-all group-hover:h-1.5 group-hover:bg-white/30">
                                        <div className="h-full bg-[#E50914] w-1/3 relative">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#E50914] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity translate-x-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Control Actions - Netflix layout */}
                                <div className="w-full flex items-center justify-between mt-2">
                                    
                                    {/* Left Controls */}
                                    <div className="flex items-center gap-6">
                                        <button className="text-white hover:scale-110 transition-transform">
                                            <Play className="w-7 h-7 md:w-9 md:h-9 fill-white" />
                                        </button>
                                        
                                        <button 
                                            onClick={handleSkipIntro}
                                            className="text-white hover:scale-110 transition-transform"
                                            title="Skip 85s"
                                        >
                                            <FastForward className="w-6 h-6 md:w-8 md:h-8" />
                                        </button>

                                        <div className="group relative flex items-center gap-4">
                                            <button className="text-white hover:scale-110 transition-transform">
                                                <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Controls */}
                                    <div className="flex items-center gap-6">
                                        {/* Watch Party */}
                                        <button
                                            onClick={() => setIsWatchParty(!isWatchParty)}
                                            className={`hover:scale-110 transition-transform ${isWatchParty ? 'text-[#E50914]' : 'text-white hover:text-gray-300'}`}
                                        >
                                            <Users className="w-6 h-6 md:w-8 md:h-8" />
                                        </button>

                                        {/* Settings */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSettings(!showSettings)}
                                                className="text-white hover:scale-110 hover:text-gray-300 transition-transform"
                                            >
                                                <Settings className="w-6 h-6 md:w-8 md:h-8" />
                                            </button>

                                            <AnimatePresence>
                                                {showSettings && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                        className="absolute bottom-full right-0 mb-6 z-[300] w-72 bg-black/90 backdrop-blur-3xl rounded-lg p-6 shadow-2xl space-y-6"
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                                <div className="flex items-center gap-2"><Sun className="w-4 h-4" /> Brightness</div>
                                                                <span>{brightness}%</span>
                                                            </div>
                                                            <input type="range" min="10" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-[#E50914] h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer" />
                                                        </div>

                                                        <div className="pt-4 border-t border-white/10 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-300"><FastForward className="w-4 h-4" /> Speed</div>
                                                                <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm outline-none text-white focus:border-white">
                                                                    <option value={0.5} className="bg-black">0.5x</option>
                                                                    <option value={1} className="bg-black">1x</option>
                                                                    <option value={1.5} className="bg-black">1.5x</option>
                                                                    <option value={2} className="bg-black">2x</option>
                                                                </select>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-300"><Sparkles className="w-4 h-4" /> Ambient Glow</div>
                                                                <button onClick={() => setAmbientGlow(!ambientGlow)} className={`w-12 h-6 rounded-full relative transition-colors ${ambientGlow ? 'bg-[#E50914]' : 'bg-white/30'}`}>
                                                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${ambientGlow ? 'translate-x-6' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Fullscreen */}
                                        <button className="text-white hover:scale-110 hover:text-gray-300 transition-transform">
                                            <Maximize className="w-6 h-6 md:w-8 md:h-8" />
                                        </button>
                                    </div>
                                    
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Smart Resume Toast */}
            <AnimatePresence>
                {smartResume && (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="absolute bottom-24 left-8 z-[250] bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-none"
                    >
                        <div className="w-24 h-14 bg-white/10 rounded-lg overflow-hidden relative">
                           <img src={item.backdrop || item.poster || ''} className="w-full h-full object-cover opacity-60" />
                           <div className="absolute inset-0 flex items-center justify-center">
                               <Play className="w-5 h-5 text-white" />
                           </div>
                        </div>
                        <div>
                            <p className="text-xs text-brand font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Smart Resume</p>
                            <p className="text-sm text-white font-medium">Reprise à 41:12</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Watch Party Sidebar */}
            <AnimatePresence>
                {isWatchParty && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="absolute top-0 right-0 bottom-0 w-80 bg-black/80 backdrop-blur-3xl border-l border-white/10 z-[250] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white leading-tight">Watch Party</h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-blue-400">5 En Ligne</p>
                                </div>
                            </div>
                            <button onClick={() => setIsWatchParty(false)} className="text-white/50 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col" style={{ scrollbarWidth: 'none' }}>
                            {chatMessages.map((msg, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="flex flex-col gap-1"
                                >
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-bold text-white/70">{msg.user}</span>
                                        <span className="text-[9px] text-white/30 font-bold">{msg.time}</span>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-white/90 self-start max-w-[85%]">
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/50">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Envoyer un message..." 
                                    className="w-full bg-white/10 border border-white/10 rounded-full py-3 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white placeholder-white/40 pr-24"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-rose-500 transition-colors">
                                        <Heart className="w-4 h-4 fill-rose-500" />
                                    </button>
                                    <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors shadow-lg">
                                        <Send className="w-3.5 h-3.5 ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
