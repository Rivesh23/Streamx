export interface MediaItem {
    tmdb_id: number;
    type: 'movie' | 'tv';
    title: string;
    poster: string | null;
    backdrop: string | null;
    overview: string;
}

export interface Season {
    season_number: number;
    episode_count: number;
}

export interface TVDetails {
    seasons: Season[];
}

const API_BASE = 'http://localhost:8000/api';

export const api = {
    getLibrary: async (): Promise<MediaItem[]> => {
        const res = await fetch(`${API_BASE}/media`);
        return res.json();
    },

    getTrending: async (): Promise<MediaItem[]> => {
        const res = await fetch(`${API_BASE}/trending`);
        return res.json();
    },

    getPopularMovies: async (): Promise<MediaItem[]> => {
        const res = await fetch(`${API_BASE}/discover?media_type=movie`);
        return res.json();
    },

    getTopTV: async (): Promise<MediaItem[]> => {
        const res = await fetch(`${API_BASE}/discover?media_type=tv`);
        return res.json();
    },

    search: async (query: string): Promise<MediaItem[]> => {
        if (!query || query.length < 2) return [];
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        return res.json();
    },

    getTVDetails: async (tmdbId: number): Promise<TVDetails> => {
        const res = await fetch(`${API_BASE}/tv/${tmdbId}/details`);
        return res.json();
    },

    addToLibrary: async (item: MediaItem) => {
        await fetch(`${API_BASE}/library/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdb_id: item.tmdb_id, type: item.type, title: item.title })
        });
    },

    like: async (item: MediaItem) => {
        // Placeholder for like functionality
        console.log("Liked:", item.title);
        return Promise.resolve();
    },

    getProgress: async (tmdbId: number) => {
        const res = await fetch(`${API_BASE}/progress/${tmdbId}`);
        return res.json();
    },

    saveProgress: async (tmdbId: number, time: number, watched: boolean) => {
        await fetch(`${API_BASE}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdb_id: tmdbId, time, watched })
        });
    }
};
