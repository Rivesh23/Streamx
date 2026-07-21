import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Search, Bookmark, User, X, Film, Tv, Play, Music2, BookOpen } from 'lucide-react';
import { api, MediaItem } from '../api';

interface NavbarProps {
    onSearch?: (q: string) => void;
    searchQuery?: string;
}

export default function Navbar({ onSearch, searchQuery = '' }: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState(searchQuery);
    const [focused, setFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setQuery(searchQuery); }, [searchQuery]);

    // Live search suggestions effect
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const results = await api.search(query.trim());
                setSuggestions(Array.isArray(results) ? results.slice(0, 5) : []);
            } catch {
                setSuggestions([]);
            }
            setLoadingSuggestions(false);
        }, 250);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [query]);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            setFocused(false);
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        onSearch?.('');
        inputRef.current?.focus();
    };

    const navLinks = [
        { label: 'Home', path: '/' },
        { label: 'Movies', path: '/movies' },
        { label: 'TV Shows', path: '/tv' },
        { label: 'My List', path: '/my-list' },
    ];

    const isLinkActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // Active profile info from LocalStorage
    const activeProfileStr = localStorage.getItem('streamx_active_profile');
    const activeProfile = activeProfileStr ? JSON.parse(activeProfileStr) : { name: 'Admin', avatar: '😎' };

    return (
        <nav className="navbar">
            {/* Logo */}
            <button className="navbar-logo" onClick={() => navigate('/')}>
                <span className="navbar-logo-dot" />
                <span style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900
                }}>
                    Au<span style={{ color: 'var(--accent)', WebkitTextFillColor: 'initial' }}>ra</span>
                </span>
            </button>

            {/* Sub-App Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: '3px 5px', border: '1px solid var(--border)' }}>
                {[
                    { label: '🎬 Video', path: '/' },
                    { label: '📚 Knowledge', path: '/knowledge' },
                    { label: '🎵 Audio', path: '/audio' },
                ].map(app => {
                    const isAppActive = app.path === '/'
                        ? !location.pathname.startsWith('/knowledge') && !location.pathname.startsWith('/audio')
                        : location.pathname.startsWith(app.path);
                    return (
                        <button
                            key={app.path}
                            onClick={() => navigate(app.path)}
                            style={{
                                padding: '5px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700,
                                background: isAppActive ? 'var(--accent)' : 'transparent',
                                color: isAppActive ? '#fff' : 'var(--text-3)',
                                transition: 'all 0.18s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {app.label}
                        </button>
                    );
                })}
            </div>

            {/* Video Nav Links (hidden when in Knowledge or Audio sub-app) */}
            {!location.pathname.startsWith('/knowledge') && !location.pathname.startsWith('/audio') && (
            <div className="navbar-links">
                {navLinks.map(link => (
                    <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`navbar-link ${isLinkActive(link.path) ? 'active' : ''}`}
                    >
                        {link.label}
                    </button>
                ))}
            </div>
            )}

            {/* Right side controls */}
            <div className="navbar-right">
                <div className="search-wrapper" style={{ width: focused ? 280 : 210, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <Search
                        size={15}
                        className="search-icon"
                        onClick={() => {
                            if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                            else inputRef.current?.focus();
                        }}
                        style={{ cursor: 'pointer', color: focused ? 'var(--accent)' : 'var(--text-3)' }}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search movies & shows…"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => setFocused(true)}
                        className="search-input"
                    />
                    {query && (
                        <button
                            onClick={clearSearch}
                            style={{
                                position: 'absolute', right: 10, top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-3)',
                                display: 'flex', alignItems: 'center'
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}

                    {/* Instant suggestions dropdown */}
                    {focused && query.trim().length > 0 && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: 'absolute', top: 'calc(100% + 8px)', right: 0, left: 0,
                                minWidth: 320, background: 'rgba(24, 27, 34, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid var(--border-glow)',
                                borderRadius: 'var(--radius)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 200, padding: '8px 0', overflow: 'hidden'
                            }}
                        >
                            {loadingSuggestions ? (
                                <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                                    Searching…
                                </div>
                            ) : suggestions.length > 0 ? (
                                <>
                                    <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.1em' }}>
                                        Quick Results
                                    </div>
                                    {suggestions.map(item => (
                                        <div
                                            key={`${item.type}-${item.tmdb_id}`}
                                            onClick={() => {
                                                setFocused(false);
                                                navigate(`/${item.type}/${item.tmdb_id}`);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 14px', cursor: 'pointer',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {item.poster ? (
                                                <img src={item.poster} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                                            ) : (
                                                <div style={{ width: 32, height: 48, background: 'var(--surface-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Play size={12} />
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    {item.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                                                    <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => {
                                            setFocused(false);
                                            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                                        }}
                                        style={{
                                            padding: '10px 14px', borderTop: '1px solid var(--border)',
                                            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                                            textAlign: 'center', cursor: 'pointer', background: 'var(--accent-bg)'
                                        }}
                                    >
                                        See all results for "{query}"
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                                    No titles found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    className="btn-icon"
                    onClick={() => navigate('/my-list')}
                    aria-label="My List"
                    title="My List"
                >
                    <Bookmark size={18} />
                </button>

                <button
                    onClick={() => navigate('/profile')}
                    aria-label="Profile"
                    title={`${activeProfile.name}'s Profile`}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                        color: '#fff', border: '2px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, cursor: 'pointer',
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 18px rgba(99, 102, 241, 0.5)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.3)';
                    }}
                >
                    {activeProfile.avatar || activeProfile.name.charAt(0)}
                </button>
            </div>
        </nav>
    );
}
