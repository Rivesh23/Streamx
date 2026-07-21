import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Film, Tv, LayoutGrid, Sparkles } from 'lucide-react';
import { api, MediaItem } from './api';
import Navbar from './components/Navbar';
import MediaCard from './components/Poster';

type Filter = 'all' | 'movie' | 'tv';

const FILTERS: { id: Filter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Results', icon: <LayoutGrid size={14} /> },
    { id: 'movie', label: 'Movies', icon: <Film size={14} /> },
    { id: 'tv', label: 'TV Shows', icon: <Tv size={14} /> },
];

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQ = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQ);
    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');
    const [searched, setSearched] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const performSearch = useCallback((q: string) => {
        if (!q.trim()) {
            setResults([]);
            setSearched(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        setSearched(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            try {
                const res = await api.search(q.trim());
                setResults(Array.isArray(res) ? res : []);
            } catch {
                setResults([]);
            }
            setLoading(false);
            setSearched(true);
        }, 300);
    }, []);

    useEffect(() => {
        performSearch(query);
        if (query.trim()) {
            setSearchParams({ q: query.trim() }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [query, performSearch, setSearchParams]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filteredResults = filter === 'all' ? results : results.filter(r => r.type === filter);
    const movieCount = results.filter(r => r.type === 'movie').length;
    const tvCount = results.filter(r => r.type === 'tv').length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar searchQuery={query} onSearch={q => setQuery(q)} />

            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 28px 80px' }}>

                {/* Big Search Input Box */}
                <div style={{ position: 'relative', marginBottom: 36 }}>
                    <Search
                        size={22}
                        style={{
                            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                            color: query ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.2s',
                        }}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search for movies, TV shows, actors, or genres…"
                        style={{
                            width: '100%',
                            padding: '18px 52px 18px 58px',
                            background: 'var(--surface-elevated)',
                            border: `1.5px solid ${query ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-xl)',
                            fontSize: 18,
                            fontWeight: 500,
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxShadow: query ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            style={{
                                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                                padding: 8, borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Blank State (No search input) */}
                {!query && !loading && (
                    <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'var(--accent-bg)', border: '1px solid var(--border-glow)',
                            color: 'var(--accent)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 20px'
                        }}>
                            <Sparkles size={36} />
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
                            Discover Cinema & Series
                        </h2>
                        <p style={{ color: 'var(--text-2)', fontSize: 15, maxWidth: 440, margin: '0 auto' }}>
                            Type a movie title or TV show name to search across the entire catalog.
                        </p>
                    </div>
                )}

                {/* Loading Grid */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
                        ))}
                    </div>
                )}

                {/* Results Section */}
                {!loading && searched && results.length > 0 && (
                    <>
                        {/* Filter Tabs Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 24, flexWrap: 'wrap', gap: 14
                        }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {FILTERS.map(f => {
                                    const count = f.id === 'all' ? results.length : f.id === 'movie' ? movieCount : tvCount;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id)}
                                            className={`category-tab ${filter === f.id ? 'active' : ''}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            {f.icon} {f.label}
                                            <span style={{
                                                marginLeft: 4, padding: '2px 7px', borderRadius: 999,
                                                background: filter === f.id ? 'var(--accent)' : 'var(--surface-3)',
                                                color: filter === f.id ? '#fff' : 'var(--text-3)',
                                                fontSize: 11, fontWeight: 800,
                                            }}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
                                Showing {filteredResults.length} title{filteredResults.length !== 1 ? 's' : ''} for "{query}"
                            </span>
                        </div>

                        {/* Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 18 }}>
                            {filteredResults.map(item => (
                                <MediaCard key={`${item.type}-${item.tmdb_id}`} item={item} showLabel />
                            ))}
                        </div>

                        {filteredResults.length === 0 && (
                            <div className="empty-state" style={{ paddingTop: 60 }}>
                                <div className="empty-state-icon">🔍</div>
                                <div className="empty-state-text">No {filter === 'movie' ? 'movies' : 'TV shows'} matching "{query}"</div>
                            </div>
                        )}
                    </>
                )}

                {/* Empty Results State */}
                {!loading && searched && results.length === 0 && (
                    <div className="empty-state" style={{ paddingTop: 80 }}>
                        <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                        <div className="empty-state-text" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                            No results found for "{query}"
                        </div>
                        <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 8 }}>
                            Try checking for spelling errors or searching for a different keyword
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
