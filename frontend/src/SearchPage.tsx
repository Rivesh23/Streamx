import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Film, Tv, LayoutGrid } from 'lucide-react';
import { api, MediaItem } from './api';
import Navbar from './components/Navbar';
import MediaCard from './components/Poster';

type Filter = 'all' | 'movie' | 'tv';

const FILTERS: { id: Filter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <LayoutGrid size={14} /> },
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

    const doSearch = useCallback((q: string) => {
        if (!q.trim()) { setResults([]); setSearched(false); return; }
        setLoading(true);
        setSearched(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            try {
                const res = await api.search(q);
                setResults(Array.isArray(res) ? res : []);
            } catch { setResults([]); }
            setLoading(false);
            setSearched(true);
        }, 350);
    }, []);

    // Search on query change
    useEffect(() => {
        doSearch(query);
        if (query) setSearchParams({ q: query }, { replace: true });
        else setSearchParams({}, { replace: true });
    }, [query]);

    // Auto-focus input
    useEffect(() => { inputRef.current?.focus(); }, []);

    const filtered = filter === 'all' ? results : results.filter(r => r.type === filter);
    const movieCount = results.filter(r => r.type === 'movie').length;
    const tvCount = results.filter(r => r.type === 'tv').length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar onSearch={() => {}} searchQuery="" />

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: 32 }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
                            color: query ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.2s',
                        }}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search movies, TV shows…"
                        style={{
                            width: '100%',
                            padding: '16px 48px 16px 52px',
                            background: 'var(--surface)',
                            border: `1.5px solid ${query ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 14,
                            fontSize: 17,
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxShadow: query ? '0 0 0 3px var(--accent-glow)' : 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                padding: 6, borderRadius: 8,
                                background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Empty state — no query */}
                {!query && !loading && (
                    <div style={{ textAlign: 'center', paddingTop: 80 }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                            Find your next watch
                        </h2>
                        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
                            Search for any movie or TV show
                        </p>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14 }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 222, borderRadius: 12 }} />
                        ))}
                    </div>
                )}

                {/* Results */}
                {!loading && searched && results.length > 0 && (
                    <>
                        {/* Filter tabs + count */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {FILTERS.map(f => {
                                    const count = f.id === 'all' ? results.length : f.id === 'movie' ? movieCount : tvCount;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id)}
                                            className={`category-tab ${filter === f.id ? 'active' : ''}`}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                                        >
                                            {f.icon} {f.label}
                                            <span style={{
                                                marginLeft: 3, padding: '1px 6px', borderRadius: 999,
                                                background: filter === f.id ? 'var(--accent)' : 'var(--surface-3)',
                                                color: filter === f.id ? '#000' : 'var(--text-3)',
                                                fontSize: 10, fontWeight: 800,
                                            }}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
                                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14 }}>
                            {filtered.map(item => (
                                <MediaCard key={`${item.type}-${item.tmdb_id}`} item={item} showLabel />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <div className="empty-state-text">No {filter === 'movie' ? 'movies' : 'TV shows'} found for "{query}"</div>
                            </div>
                        )}
                    </>
                )}

                {/* No results */}
                {!loading && searched && results.length === 0 && (
                    <div className="empty-state" style={{ paddingTop: 80 }}>
                        <div className="empty-state-icon">😕</div>
                        <div className="empty-state-text">No results found for "{query}"</div>
                        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>Try a different title or check your spelling</p>
                    </div>
                )}
            </div>
        </div>
    );
}
