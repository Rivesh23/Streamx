import axios from 'axios';
import { Track } from '../AudioContext';

export const youtubeAudioApi = {
    // Search YouTube via backend proxy (eliminates CORS & timeout issues)
    searchYouTube: async (query: string): Promise<Track[]> => {
        if (!query.trim()) return [];
        try {
            const res = await axios.get('/api/audio/search', {
                params: { q: query.trim(), source: 'youtube' },
            });
            return res.data || [];
        } catch {
            return [];
        }
    },

    // Get direct playable stream URL for a YouTube video via backend proxy
    getAudioStreamUrl: async (videoId: string): Promise<string | null> => {
        try {
            const res = await axios.get(`/api/audio/stream/${videoId}`);
            return res.data?.url || null;
        } catch {
            return `https://pipedapi.kavin.rocks/proxy?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
        }
    },
};
