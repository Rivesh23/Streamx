import axios from 'axios';

export interface MediaItem {
    tmdb_id: number;
    type: 'movie' | 'tv';
    title: string;
    poster?: string;
    backdrop?: string;
    overview?: string;
    progress?: number;
}

const client = axios.create({
    baseURL: '/api'
});

// Helper to generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get or create user ID
const getUserId = () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('user_id', userId);
    }
    return userId;
};

// Interceptor to add auth token and user ID
client.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-User-ID'] = getUserId();
    return config;
});

export const api = {
    login: (credentials: any) => client.post('/login', credentials).then(r => r.data),
    register: (credentials: any) => client.post('/register', credentials).then(r => r.data),
    getLibrary: () => client.get<MediaItem[]>('/media').then(r => r.data),
    getTrending: () => client.get<MediaItem[]>('/trending').then(r => r.data),
    getPopularMovies: () => client.get<MediaItem[]>('/discover?media_type=movie').then(r => r.data),
    getTopTV: () => client.get<MediaItem[]>('/discover?media_type=tv').then(r => r.data),
    getContinueWatching: () => client.get<MediaItem[]>('/continue-watching').then(r => r.data),
    getGenres: (type: 'movie' | 'tv') => client.get(`/genres?media_type=${type}`).then(r => r.data),
    search: (q: string) => client.get<MediaItem[]>(`/search?q=${q}`).then(r => r.data),
    addToLibrary: (item: MediaItem) => client.post('/library/add', item),
    getTVDetails: (id: number) => client.get(`/tv/${id}/details`).then(r => r.data),
    getProgress: (id: number) => client.get(`/progress/${id}`).then(r => r.data),
    saveProgress: (id: number, time: number, watched: boolean, type?: string, title?: string) =>
        client.post('/progress', { tmdb_id: id, time, watched, type, title }),
    getFavorites: () => client.get<MediaItem[]>('/favorites').then(r => r.data),
    toggleFavorite: (item: MediaItem) => client.post('/favorites/toggle', item).then(r => r.data),
    checkFavorite: (id: number) => client.get<{ is_favorite: boolean }>(`/favorites/check/${id}`).then(r => r.data)
};
