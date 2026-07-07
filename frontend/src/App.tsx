import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

import Home from './Home';
import MovieDetailPage from './MovieDetailPage';
import Profile from './Profile';
import SearchPage from './SearchPage';
import UserDashboard from './UserDashboard';

// Mock auth check
const isAuthenticated = () => {
    return !!localStorage.getItem('streamx_active_profile');
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    if (!isAuthenticated()) {
        return <Navigate to="/profile" replace />;
    }
    return <>{children}</>;
}

export default function App() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const on = () => setIsOffline(false);
        const off = () => setIsOffline(true);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);

    return (
        <HashRouter>
            {isOffline && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
                    background: '#EF4444', color: '#fff', textAlign: 'center',
                    padding: '8px', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                    <WifiOff size={14} /> No Internet Connection
                </div>
            )}
            <Routes>
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                <Route path="/movie/:id" element={<ProtectedRoute><MovieDetailPage /></ProtectedRoute>} />
                <Route path="/tv/:id" element={<ProtectedRoute><MovieDetailPage /></ProtectedRoute>} />
                
                <Route path="/movies" element={<ProtectedRoute><Home defaultTab="movies" /></ProtectedRoute>} />
                <Route path="/series" element={<ProtectedRoute><Home defaultTab="tv" /></ProtectedRoute>} />
                <Route path="/list" element={<ProtectedRoute><Home defaultTab="list" /></ProtectedRoute>} />
                
                <Route path="/" element={<ProtectedRoute><Home defaultTab="home" /></ProtectedRoute>} />
            </Routes>
        </HashRouter>
    );
}
