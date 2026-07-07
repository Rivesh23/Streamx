import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, X } from 'lucide-react';
import { api } from '../api';

interface NavbarProps {
    onSearch?: (q: string) => void;
    searchQuery?: string;
}

export default function Navbar({ onSearch, searchQuery = '' }: NavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState(searchQuery);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setQuery(searchQuery); }, [searchQuery]);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const clearSearch = () => {
        setQuery('');
        onSearch?.('');
        inputRef.current?.focus();
    };

    const links = [
        { label: 'Home', path: '/' },
        { label: 'Movies', path: '/movies' },
        { label: 'TV Shows', path: '/series' },
        { label: 'My List', path: '/list' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="navbar">
            {/* Logo */}
            <button className="navbar-logo" onClick={() => navigate('/')}>
                <span className="navbar-logo-dot" />
                StreamX
            </button>

            {/* Nav links */}
            <div className="navbar-links">
                {links.map(link => (
                    <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                    >
                        {link.label}
                    </button>
                ))}
            </div>

            {/* Right: search + avatar */}
            <div className="navbar-right">
                <div className="search-wrapper" style={{ maxWidth: focused ? 280 : 200, transition: 'max-width 0.2s' }}>
                    <Search size={15} className="search-icon" onClick={() => {
                        if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                        else inputRef.current?.focus();
                    }} style={{ cursor: 'pointer' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search…"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            onSearch?.(e.target.value);
                        }}
                        onKeyDown={handleSearch}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
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
                </div>

                <button className="btn-icon" onClick={() => navigate('/list')} aria-label="My List">
                    <Bell size={18} />
                </button>

                <button
                    className="btn-icon"
                    onClick={() => navigate('/dashboard')}
                    aria-label="Dashboard"
                    style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--accent)', color: 'var(--accent-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14
                    }}
                >
                    U
                </button>
            </div>
        </nav>
    );
}
