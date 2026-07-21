import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, X, Check, Trash2, Clock, Bookmark, User, Settings, Play, ArrowLeft, Monitor, Wifi, Flame, Shield, Sliders, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { api, MediaItem } from './api';
import { useAudio, EQPreset } from './AudioContext';
import Navbar from './components/Navbar';
import MediaCard from './components/Poster';
import MobileBottomNav from './components/MobileBottomNav';

interface ProfileData {
    id: string;
    name: string;
    avatar: string;
    color: string;
    isKids: boolean;
}

const AVATAR_COLORS = [
    'from-indigo-600 to-purple-900',
    'from-violet-600 to-indigo-900',
    'from-sky-500 to-blue-800',
    'from-emerald-500 to-teal-800',
    'from-amber-500 to-orange-800',
    'from-pink-500 to-rose-800',
];

const AVATAR_EMOJIS = ['😎', '🦊', '🐺', '🎮', '🚀', '👻', '🔥', '💎', '🎬', '🌙', '⚡', '🎯'];

const DEFAULT_PROFILES: ProfileData[] = [
    { id: '1', name: 'Admin', avatar: '😎', color: AVATAR_COLORS[0], isKids: false },
    { id: '2', name: 'Guest', avatar: '👻', color: AVATAR_COLORS[1], isKids: false },
    { id: '3', name: 'Kids', avatar: '🦊', color: AVATAR_COLORS[2], isKids: true },
];

export default function Profile() {
    const navigate = useNavigate();
    const { eqPreset, setEqPreset } = useAudio();

    // Profiles state
    const [profiles, setProfiles] = useState<ProfileData[]>(() => {
        const stored = localStorage.getItem('streamx_profiles');
        return stored ? JSON.parse(stored) : DEFAULT_PROFILES;
    });

    const [activeProfile, setActiveProfile] = useState<ProfileData>(() => {
        const stored = localStorage.getItem('streamx_active_profile');
        return stored ? JSON.parse(stored) : profiles[0];
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ProfileData | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Profile form state
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('🎮');
    const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
    const [newIsKids, setNewIsKids] = useState(false);

    // User Watch History, Watchlist, and Stats state
    const [history, setHistory] = useState<MediaItem[]>([]);
    const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'watchlist' | 'history' | 'profiles'>('overview');

    // Real-Time Dashboard Info
    const [currentTimeStr, setCurrentTimeStr] = useState('');
    const [currentDateStr, setCurrentDateStr] = useState('');
    const [deviceType, setDeviceType] = useState('Desktop / Laptop');
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('streamx_accent') || '#6366F1');
    const [videoQualityPref, setVideoQualityPref] = useState(() => localStorage.getItem('streamx_quality_pref') || 'VidLink (4K Ultra HD)');

    // Live Clock Effect
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setCurrentDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Detect Device Type
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        if (/tv|smarttv|googletv|appletv/i.test(ua)) setDeviceType('Smart TV (10-Foot UI)');
        else if (/mobile|android|iphone|ipad/i.test(ua)) setDeviceType('Mobile / Tablet');
        else setDeviceType('Desktop / Laptop');
    }, []);

    useEffect(() => {
        localStorage.setItem('streamx_profiles', JSON.stringify(profiles));
    }, [profiles]);

    useEffect(() => {
        let cancelled = false;
        setLoadingData(true);

        Promise.allSettled([
            api.getHistory(),
            api.getWatchlist(),
        ]).then(([histRes, wlRes]) => {
            if (cancelled) return;

            let fetchedHist: MediaItem[] = histRes.status === 'fulfilled' && Array.isArray(histRes.value) ? histRes.value : [];
            let fetchedWl: MediaItem[] = wlRes.status === 'fulfilled' && Array.isArray(wlRes.value) ? wlRes.value : [];

            const storedWl: MediaItem[] = JSON.parse(localStorage.getItem('streamx_watchlist') || '[]');
            if (fetchedWl.length === 0 && storedWl.length > 0) fetchedWl = storedWl;

            setHistory(fetchedHist);
            setWatchlist(fetchedWl);
            setLoadingData(false);
        });

        return () => { cancelled = true; };
    }, []);

    const handleSelectProfile = (profile: ProfileData) => {
        if (isEditing) {
            setEditingProfile(profile);
            setNewName(profile.name);
            setNewAvatar(profile.avatar);
            setNewColor(profile.color);
            setNewIsKids(profile.isKids);
            return;
        }
        setActiveProfile(profile);
        localStorage.setItem('streamx_active_profile', JSON.stringify(profile));
    };

    const handleSaveEdit = () => {
        if (!editingProfile || !newName.trim()) return;
        setProfiles(prev => prev.map(p =>
            p.id === editingProfile.id ? { ...p, name: newName.trim(), avatar: newAvatar, color: newColor, isKids: newIsKids } : p
        ));
        setEditingProfile(null);
    };

    const handleDeleteProfile = (id: string) => {
        setProfiles(prev => prev.filter(p => p.id !== id));
        setEditingProfile(null);
    };

    const handleAddProfile = () => {
        if (!newName.trim()) return;
        const newProfile: ProfileData = {
            id: Date.now().toString(),
            name: newName.trim(),
            avatar: newAvatar,
            color: newColor,
            isKids: newIsKids,
        };
        setProfiles(prev => [...prev, newProfile]);
        setShowAddModal(false);
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear watch history and saved local data?')) {
            localStorage.removeItem('streamx_watchlist');
            localStorage.removeItem('streamx_favorites');
            api.clearHistory().catch(() => { });
            setHistory([]);
            setWatchlist([]);
        }
    };

    const handleAccentChange = (hex: string) => {
        setAccentColor(hex);
        localStorage.setItem('streamx_accent', hex);
        document.documentElement.style.setProperty('--accent', hex);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 90 }}>
            <Navbar />

            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 28px 80px' }}>

                {/* ── PROFILE HERO HEADER CARD ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '28px 32px', background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 32, flexWrap: 'wrap', gap: 20, boxShadow: 'var(--shadow)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 34, border: '2px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)'
                        }}>
                            {activeProfile.avatar}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC' }}>
                                    {activeProfile.name}
                                </h1>
                                {activeProfile.isKids && (
                                    <span style={{ background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                                        Kids
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={13} style={{ color: 'var(--accent)' }} /> Active User · Cinema-Grade Account
                            </p>
                        </div>
                    </div>

                    {/* Navigation Sub-Tabs */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(['overview', 'settings', 'watchlist', 'history', 'profiles'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                                    background: activeTab === tab ? 'var(--accent)' : 'var(--surface-2)',
                                    color: activeTab === tab ? '#fff' : 'var(--text-2)',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.18s ease', display: 'flex', alignItems: 'center', gap: 6
                                }}
                            >
                                {tab === 'overview' && <Sparkles size={14} />}
                                {tab === 'settings' && <Settings size={14} />}
                                {tab === 'watchlist' && <Bookmark size={14} />}
                                {tab === 'history' && <Clock size={14} />}
                                {tab === 'profiles' && <User size={14} />}
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === 'watchlist' && watchlist.length > 0 && <span style={{ opacity: 0.8 }}>({watchlist.length})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── OVERVIEW DASHBOARD ── */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                        {/* Real-Time Device & Environment Bar */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16
                        }}>
                            <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={13} style={{ color: 'var(--accent)' }} /> Live Time
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>
                                    {currentTimeStr || '00:00:00'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{currentDateStr}</div>
                            </div>

                            <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Monitor size={13} style={{ color: 'var(--accent)' }} /> Device Mode
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC' }}>
                                    {deviceType}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2, fontWeight: 700 }}>Adaptive Remote Ready</div>
                            </div>

                            <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Wifi size={13} style={{ color: 'var(--accent)' }} /> System Network
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>Online ⚡</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Ultra-HD 4K Engine Ready</div>
                            </div>

                            <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Flame size={13} style={{ color: '#F59E0B' }} /> Stream Streak
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B' }}>
                                    7 Days 🔥
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Daily Active Streamer</div>
                            </div>
                        </div>

                        {/* Watchlist Quick Grid */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Bookmark size={18} style={{ color: 'var(--accent)' }} /> Saved Watchlist ({watchlist.length})
                                </h2>
                                {watchlist.length > 0 && (
                                    <button onClick={() => setActiveTab('watchlist')} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                                        See All
                                    </button>
                                )}
                            </div>

                            {watchlist.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                                    {watchlist.slice(0, 6).map(item => (
                                        <MediaCard key={`wl-${item.tmdb_id}`} item={item} showLabel />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: 32, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-3)' }}>
                                    <p>Your Watchlist is currently empty. Add titles from movies or TV pages!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SETTINGS TAB ── */}
                {activeTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC' }}>System Preferences & Settings</h2>

                        {/* Preferred Video Server */}
                        <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                            <label style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', display: 'block', marginBottom: 6 }}>
                                Primary Video Stream Provider
                            </label>
                            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                                Automatic failover will switch servers if primary stream times out.
                            </p>
                            <select
                                value={videoQualityPref}
                                onChange={e => { setVideoQualityPref(e.target.value); localStorage.setItem('streamx_quality_pref', e.target.value); }}
                                style={{ width: '100%', padding: '12px 14px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }}
                            >
                                <option value="VidLink (4K Ultra HD)">VidLink (4K Ultra HD) — Recommended</option>
                                <option value="Embed.su (1080p HD)">Embed.su (1080p Full HD)</option>
                                <option value="AutoEmbed (1080p)">AutoEmbed (Auto Server)</option>
                                <option value="VidSrc Pro (HD)">VidSrc Pro (Backup)</option>
                            </select>
                        </div>

                        {/* Equalizer DSP Preset */}
                        <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                            <label style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', display: 'block', marginBottom: 6 }}>
                                Web Audio DSP Equalizer Preset
                            </label>
                            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                                Applied live across StreamX Audio music player.
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {(['Flat', 'Bass Boost', 'Vocal', 'Treble Boost', 'Electronic'] as EQPreset[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setEqPreset(p)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${eqPreset === p ? 'var(--accent)' : 'var(--border)'}`,
                                            background: eqPreset === p ? 'var(--accent-bg)' : 'var(--surface-2)',
                                            color: eqPreset === p ? 'var(--accent)' : 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Accent Color */}
                        <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
                            <label style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', display: 'block', marginBottom: 6 }}>
                                UI Theme Accent Color
                            </label>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                {[
                                    { name: 'Neon Indigo', hex: '#6366F1' },
                                    { name: 'Electric Cyan', hex: '#06B6D4' },
                                    { name: 'Cyber Pink', hex: '#EC4899' },
                                    { name: 'Emerald Glow', hex: '#10B981' },
                                ].map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => handleAccentChange(c.hex)}
                                        style={{
                                            width: 38, height: 38, borderRadius: '50%', background: c.hex,
                                            border: `3px solid ${accentColor === c.hex ? '#fff' : 'transparent'}`,
                                            cursor: 'pointer', boxShadow: accentColor === c.hex ? `0 0 16px ${c.hex}` : 'none'
                                        }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Reset Cache & History */}
                        <div style={{ padding: 20, background: 'rgba(239,68,68,0.06)', borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                            <label style={{ fontSize: 14, fontWeight: 800, color: '#F87171', display: 'block', marginBottom: 6 }}>
                                Danger Zone
                            </label>
                            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                                Clear local watch history, favorites, and cached stream metadata.
                            </p>
                            <button onClick={handleClearData} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Trash2 size={15} /> Clear Saved Data & History
                            </button>
                        </div>
                    </div>
                )}

                {/* ── WATCHLIST TAB ── */}
                {activeTab === 'watchlist' && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 20 }}>Saved Watchlist ({watchlist.length})</h2>
                        {watchlist.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(154px, 1fr))', gap: 16 }}>
                                {watchlist.map(item => (
                                    <MediaCard key={`wl-tab-${item.tmdb_id}`} item={item} showLabel />
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 16, textAlign: 'center', color: 'var(--text-3)' }}>
                                Your watchlist is empty.
                            </div>
                        )}
                    </div>
                )}

                {/* ── WATCH HISTORY TAB ── */}
                {activeTab === 'history' && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 20 }}>Recently Watched ({history.length})</h2>
                        {history.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(154px, 1fr))', gap: 16 }}>
                                {history.map(item => (
                                    <MediaCard key={`hist-tab-${item.tmdb_id}`} item={item} showLabel />
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 16, textAlign: 'center', color: 'var(--text-3)' }}>
                                No watch history available.
                            </div>
                        )}
                    </div>
                )}

                {/* ── PROFILES TAB ── */}
                {activeTab === 'profiles' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC' }}>Manage Account Profiles</h2>
                            <button onClick={() => setIsEditing(v => !v)} className="btn btn-ghost">
                                {isEditing ? <Check size={16} /> : <Pencil size={16} />} {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
                            {profiles.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelectProfile(p)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                                        padding: 16, borderRadius: 16, background: activeProfile.id === p.id ? 'var(--accent-bg)' : 'var(--surface)',
                                        border: `1.5px solid ${activeProfile.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
                                        cursor: 'pointer', transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                                        {p.avatar}
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: activeProfile.id === p.id ? 'var(--accent)' : 'var(--text)' }}>
                                        {p.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
        </div>
    );
}
