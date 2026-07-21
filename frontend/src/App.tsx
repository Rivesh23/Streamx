import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

import Home from './Home';
import MovieDetailPage from './MovieDetailPage';
import Profile from './Profile';
import SearchPage from './SearchPage';
import KnowledgePage from './KnowledgePage';
import AudioPage from './AudioPage';
import ArtistPage from './ArtistPage';
import AlbumPage from './AlbumPage';
import { AudioProvider } from './AudioContext';
import AudioPlayerBar from './components/AudioPlayerBar';

export default function App() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const on = () => setIsOffline(false);
        const off = () => setIsOffline(true);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    return (
        <AudioProvider>
            <BrowserRouter>
                {isOffline && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                        background: '#EF4444', color: '#fff', textAlign: 'center',
                        padding: '8px', fontSize: '13px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                        <WifiOff size={14} /> No Internet Connection
                    </div>
                )}
                <Routes>
                    {/* ── StreamX Video ── */}
                    <Route path="/" element={<Home defaultTab="home" />} />
                    <Route path="/movies" element={<Home defaultTab="movies" />} />
                    <Route path="/tv" element={<Home defaultTab="tv" />} />
                    <Route path="/my-list" element={<Home defaultTab="list" />} />

                    {/* Legacy redirects */}
                    <Route path="/series" element={<Navigate to="/tv" replace />} />
                    <Route path="/list" element={<Navigate to="/my-list" replace />} />

                    {/* Detail & Player routes */}
                    <Route path="/movie/:id" element={<MovieDetailPage />} />
                    <Route path="/tv/:id" element={<MovieDetailPage />} />
                    <Route path="/tv/:id/season/:season/episode/:episode" element={<MovieDetailPage />} />

                    {/* Search */}
                    <Route path="/search" element={<SearchPage />} />

                    {/* Profile & History */}
                    <Route path="/profile" element={<Profile />} />

                    {/* ── StreamX Knowledge ── */}
                    <Route path="/knowledge" element={<KnowledgePage />} />

                    {/* ── StreamX Audio ── */}
                    <Route path="/audio" element={<AudioPage />} />
                    <Route path="/audio/artist/:id" element={<ArtistPage />} />
                    <Route path="/audio/album/:id" element={<AlbumPage />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Persistent Global Audio Player Bar across all routes */}
                <AudioPlayerBar />
            </BrowserRouter>
        </AudioProvider>
    );
}
