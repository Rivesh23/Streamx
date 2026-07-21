import axios from 'axios';
import { Track } from '../AudioContext';

const JIOSAAVN_PRIMARY = 'https://saavn.dev/api';

export interface SaavnArtist {
    id: string;
    name: string;
    role?: string;
    image?: { quality: string; link: string; url?: string }[];
}

export interface SaavnAlbumDetails {
    id: string;
    name: string;
    description?: string;
    year?: number;
    header_desc?: string;
    type?: string;
    play_count?: number;
    language?: string;
    has_explicit?: boolean;
    artists?: SaavnArtist[];
    image?: { quality: string; link: string; url?: string }[];
    songs?: any[];
}

export interface SaavnArtistDetails {
    id: string;
    name: string;
    bio?: { text: string }[];
    image?: { quality: string; link: string; url?: string }[];
    followerCount?: number;
    topSongs?: any[];
    topAlbums?: any[];
}

function getBestImage(images?: any[]): string {
    if (!images || !Array.isArray(images) || images.length === 0) return '';
    const img500 = images.find(i => (i.quality === '500x500' || i.quality === '500x500'));
    if (img500) return img500.link || img500.url || '';
    const last = images[images.length - 1];
    return last.link || last.url || '';
}

function getBestAudioUrl(downloadUrls?: any[]): string | null {
    if (!downloadUrls || !Array.isArray(downloadUrls) || downloadUrls.length === 0) return null;
    const q320 = downloadUrls.find(d => d.quality === '320kbps');
    if (q320) return q320.link || q320.url;
    const q160 = downloadUrls.find(d => d.quality === '160kbps');
    if (q160) return q160.link || q160.url;
    const last = downloadUrls[downloadUrls.length - 1];
    return last.link || last.url || null;
}

function parseSaavnTrack(song: any): Track {
    const streamUrl = getBestAudioUrl(song.downloadUrl) || song.url || null;
    const artwork = getBestImage(song.image);
    const artistName = song.artists?.primary?.map((a: any) => a.name).join(', ') ||
        (Array.isArray(song.artists) ? song.artists.map((a: any) => a.name).join(', ') : (song.primaryArtists || 'Unknown Artist'));
    const artistId = song.artists?.primary?.[0]?.id || (Array.isArray(song.artists) ? song.artists[0]?.id : undefined);

    return {
        id: String(song.id),
        title: song.name || song.title || 'Unknown Track',
        artist: artistName,
        artistId: artistId ? String(artistId) : undefined,
        album: song.album?.name || (typeof song.album === 'string' ? song.album : ''),
        albumId: song.album?.id ? String(song.album.id) : undefined,
        artworkUrl: artwork,
        previewUrl: streamUrl,
        downloadUrl: streamUrl,
        durationMs: (Number(song.duration) || 0) * 1000,
        genre: song.language || song.year ? `${song.language || ''} ${song.year || ''}`.trim() : 'Music',
        hasSyncedLyrics: song.hasLyrics === 'true' || song.hasLyrics === true,
    };
}

export const audioApi = {
    // Search songs via backend proxy
    searchSongs: async (query: string, source: string = 'saavn'): Promise<Track[]> => {
        if (!query.trim()) return [];
        try {
            const res = await axios.get('/api/audio/search', {
                params: { q: query.trim(), source }
            });
            return res.data || [];
        } catch {
            return [];
        }
    },

    // Get Artist Details
    getArtist: async (id: string): Promise<{ details: SaavnArtistDetails; topTracks: Track[]; topAlbums: any[] } | null> => {
        try {
            const res = await axios.get(`${JIOSAAVN_PRIMARY}/artists`, { params: { id } });
            const data = res.data?.data || res.data;
            if (!data) return null;
            const topTracks = (data.topSongs || data.songs || []).map(parseSaavnTrack);
            return {
                details: {
                    id: String(data.id),
                    name: data.name,
                    bio: data.bio,
                    image: data.image,
                    followerCount: data.followerCount,
                },
                topTracks,
                topAlbums: data.topAlbums || data.albums || [],
            };
        } catch {
            return null;
        }
    },

    // Get Album Details
    getAlbum: async (id: string): Promise<{ details: SaavnAlbumDetails; tracks: Track[] } | null> => {
        try {
            const res = await axios.get(`${JIOSAAVN_PRIMARY}/albums`, { params: { id } });
            const data = res.data?.data || res.data;
            if (!data) return null;
            const tracks = (data.songs || []).map(parseSaavnTrack);
            return {
                details: {
                    id: String(data.id),
                    name: data.name,
                    year: data.year,
                    artists: data.artists?.primary || data.artists,
                    image: data.image,
                },
                tracks,
            };
        } catch {
            return null;
        }
    },
};
