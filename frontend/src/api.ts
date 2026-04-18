import axios from 'axios';

export interface MediaItem {
    tmdb_id: number;
    type: 'movie' | 'tv';
    title: string;
    poster?: string;
    backdrop?: string;
    overview?: string;
    progress?: number;
    is_local?: boolean;
}

const client = axios.create({ baseURL: '/api' });

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const getUserId = () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) { userId = generateUUID(); localStorage.setItem('user_id', userId); }
    return userId;
};

client.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-User-ID'] = getUserId();
    return config;
});

export const api = {
    // Auth
    login: (creds: any) => client.post('/login', creds).then(r => r.data),
    register: (creds: any) => client.post('/register', creds).then(r => r.data),

    // Library & Discovery
    getLibrary: () => client.get<MediaItem[]>('/media').then(r => r.data),
    getTrending: () => client.get<MediaItem[]>('/trending').then(r => r.data),
    getPopularMovies: () => client.get<MediaItem[]>('/discover?media_type=movie').then(r => r.data),
    getTopTV: () => client.get<MediaItem[]>('/discover?media_type=tv').then(r => r.data),
    getGenres: (type: 'movie' | 'tv') => client.get(`/genres?media_type=${type}`).then(r => r.data),
    search: (q: string) => client.get<MediaItem[]>(`/search?q=${q}`).then(r => r.data),
    getSimilar: (id: number, type: string) => client.get<MediaItem[]>(`/similar/${id}?media_type=${type}`).then(r => r.data),
    getByGenre: (type: string, genreId: number) => client.get<MediaItem[]>(`/discover?media_type=${type}&genre_id=${genreId}`).then(r => r.data),

    // TV
    getTVDetails: (id: number) => client.get(`/tv/${id}/details`).then(r => r.data),

    // Library management
    addToLibrary: (item: MediaItem) => client.post('/library/add', item),

    // Progress
    getProgress: (id: number) => client.get(`/progress/${id}`).then(r => r.data),
    saveProgress: (id: number, time: number, watched: boolean, type?: string, title?: string) =>
        client.post('/progress', { tmdb_id: id, time, watched, type, title }),
    getContinueWatching: () => client.get<MediaItem[]>('/continue-watching').then(r => r.data),

    // Favorites
    getFavorites: () => client.get<MediaItem[]>('/favorites').then(r => r.data),
    toggleFavorite: (item: MediaItem) => client.post('/favorites/toggle', item).then(r => r.data),
    checkFavorite: (id: number) => client.get<{ is_favorite: boolean }>(`/favorites/check/${id}`).then(r => r.data),

    // Ratings
    rateItem: (tmdb_id: number, type: string, rating: number) => client.post('/ratings', { tmdb_id, type, rating }).then(r => r.data),
    getRating: (id: number) => client.get(`/ratings/${id}`).then(r => r.data),

    // Watchlist
    getWatchlist: () => client.get<MediaItem[]>('/watchlist').then(r => r.data),
    toggleWatchlist: (item: MediaItem) => client.post('/watchlist/toggle', item).then(r => r.data),
    checkWatchlist: (id: number) => client.get(`/watchlist/check/${id}`).then(r => r.data),

    // Watch History
    logWatch: (item: MediaItem, duration: number) => client.post('/history/log', { ...item, duration }).then(r => r.data),
    getHistory: (limit = 50) => client.get<MediaItem[]>(`/history?limit=${limit}`).then(r => r.data),
    clearHistory: () => client.delete('/history').then(r => r.data),

    // User Preferences
    getPreferences: () => client.get('/preferences').then(r => r.data),
    updatePreferences: (prefs: any) => client.put('/preferences', prefs).then(r => r.data),

    // Search History
    saveSearchHistory: (query: string) => client.post('/search-history', { query }).then(r => r.data),
    getSearchHistory: () => client.get<string[]>('/search-history').then(r => r.data),

    // Notifications
    getNotifications: () => client.get('/notifications').then(r => r.data),
    markNotificationsRead: () => client.put('/notifications/read-all').then(r => r.data),

    // Stats
    getStats: () => client.get('/stats').then(r => r.data),

    // Health
    healthCheck: () => client.get('/health').then(r => r.data),
};
