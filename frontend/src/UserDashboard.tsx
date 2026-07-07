import { useState, useEffect } from 'react';
import { Clock, PlayCircle, Star, Tv, Film } from 'lucide-react';
import { api } from './api';
import Navbar from './components/Navbar';

export default function UserDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStats().then(s => {
            setStats(s);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100, textAlign: 'center' }}>Loading dashboard...</div>;
    }

    if (!stats) return <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 100, textAlign: 'center' }}>Error loading stats.</div>;

    const hours = Math.floor(stats.total_watch_time_minutes / 60);
    const minutes = Math.floor(stats.total_watch_time_minutes % 60);

    const moviesWatched = stats.type_breakdown?.movie || 0;
    const tvWatched = stats.type_breakdown?.tv || 0;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar onSearch={() => {}} searchQuery="" />
            
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 48 }}>
                    <div style={{ 
                        width: 96, height: 96, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 40, fontWeight: 800, color: '#000',
                        boxShadow: '0 8px 32px rgba(48,209,88,0.2)'
                    }}>
                        {stats.user_id?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>
                            Your Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-3)' }}>Welcome back to StreamX</p>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 
                }}>
                    <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 20 }}>
                        <div style={{ color: 'var(--accent)', marginBottom: 12 }}><Clock size={28} /></div>
                        <h3 style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Total Watch Time</h3>
                        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {hours}h {minutes}m
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 20 }}>
                        <div style={{ color: '#0A84FF', marginBottom: 12 }}><PlayCircle size={28} /></div>
                        <h3 style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sessions Played</h3>
                        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {stats.total_sessions}
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 20 }}>
                        <div style={{ color: '#FFD60A', marginBottom: 12 }}><Star size={28} /></div>
                        <h3 style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Favorites</h3>
                        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {stats.total_favorites}
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 48, marginBottom: 20 }}>Media Breakdown</h2>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, background: 'var(--surface)', padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Film size={24} style={{ color: 'var(--text-2)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>{moviesWatched}</div>
                            <div style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>Movies</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, background: 'var(--surface)', padding: 20, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tv size={24} style={{ color: 'var(--text-2)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>{tvWatched}</div>
                            <div style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>TV Episodes</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
