import { useState, useEffect, useMemo } from 'react';
import { X, Maximize } from 'lucide-react';
import { api } from '../api';
import type { MediaItem, TVDetails } from '../api';

interface VideoPlayerProps {
    item: MediaItem;
    onClose: () => void;
}

const PROVIDERS = [
    { name: "VidSrc.vip", url: "https://vidsrc.vip/embed", type: "direct" },
    { name: "SuperEmbed", url: "https://multiembed.mov", type: "params" },
    { name: "AutoEmbed", url: "https://player.autoembed.cc/embed", type: "direct" },
    { name: "SmashyStream", url: "https://player.smashy.stream", type: "tmdb_param" },
    { name: "VidLink", url: "https://vidlink.pro", type: "movie_path" }
];

export default function VideoPlayer({ item, onClose }: VideoPlayerProps) {
    const [providerIdx, setProviderIdx] = useState(0);
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);

    useEffect(() => {
        if (item.type === 'tv') {
            api.getTVDetails(item.tmdb_id).then(setTvDetails);
        }
    }, [item]);

    const streamUrl = useMemo(() => {
        const provider = PROVIDERS[providerIdx];
        const s = season;
        const e = episode;

        if (provider.name.includes("SuperEmbed")) {
            if (item.type === 'movie') return `${provider.url}/?video_id=${item.tmdb_id}&tmdb=1`;
            else return `${provider.url}/?video_id=${item.tmdb_id}&tmdb=1&s=${s}&e=${e}`;
        } else if (provider.name.includes("Smashy")) {
            if (item.type === 'movie') return `${provider.url}/movie/${item.tmdb_id}`;
            else return `${provider.url}/tv/${item.tmdb_id}?s=${s}&e=${e}`;
        } else if (provider.name.includes("VidLink")) {
            if (item.type === 'movie') return `${provider.url}/movie/${item.tmdb_id}`;
            else return `${provider.url}/tv/${item.tmdb_id}/${s}/${e}`;
        } else {
            // Standard /embed/movie/ID format
            if (item.type === 'movie') return `${provider.url}/movie/${item.tmdb_id}`;
            else return `${provider.url}/tv/${item.tmdb_id}/${s}/${e}`;
        }
    }, [item, providerIdx, season, episode]);

    const episodesInSeason = useMemo(() => {
        if (!tvDetails) return 24;
        const s = tvDetails.seasons.find(sea => sea.season_number === season);
        return s ? s.episode_count : 24;
    }, [tvDetails, season]);

    // Fullscreen helper
    const toggleFullscreen = () => {
        const elem = document.getElementById('iframe-player');
        if (!elem) return;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="bg-zinc-900 p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:bg-zinc-800 p-2 rounded-full transition">
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <span className="font-bold text-lg">{item.title}</span>
                    {item.type === 'tv' && (
                        <span className="text-gray-400 text-sm">S{season}:E{episode}</span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <select
                        className="bg-zinc-800 text-white p-2 rounded outline-none border border-transparent focus:border-zinc-600"
                        value={providerIdx}
                        onChange={(e) => setProviderIdx(Number(e.target.value))}
                    >
                        {PROVIDERS.map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                        ))}
                    </select>

                    {item.type === 'tv' && (
                        <>
                            <select
                                className="bg-zinc-800 text-white p-2 rounded w-32"
                                value={season}
                                onChange={(e) => {
                                    setSeason(Number(e.target.value));
                                    setEpisode(1);
                                }}
                            >
                                {tvDetails?.seasons?.map((s) => (
                                    s.season_number > 0 && (
                                        <option key={s.season_number} value={s.season_number}>
                                            Season {s.season_number}
                                        </option>
                                    )
                                )) || <option value={1}>Season 1</option>}
                            </select>

                            <select
                                className="bg-zinc-800 text-white p-2 rounded w-24"
                                value={episode}
                                onChange={(e) => setEpisode(Number(e.target.value))}
                            >
                                {Array.from({ length: episodesInSeason }, (_, i) => i + 1).map((ep) => (
                                    <option key={ep} value={ep}>Ep {ep}</option>
                                ))}
                            </select>
                        </>
                    )}

                    <button onClick={toggleFullscreen} className="hover:bg-zinc-800 p-2 rounded-full">
                        <Maximize className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-black relative">
                <iframe
                    id="iframe-player"
                    src={streamUrl}
                    className="w-full h-full border-none"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
}
