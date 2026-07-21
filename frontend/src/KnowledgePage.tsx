import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Volume2, ExternalLink, Play, Film, Tv2, X, ChevronRight, Loader2, BookMarked, Library, Music2, Maximize2, Info } from 'lucide-react';
import { knowledgeApi, WikiArticle, DictEntry, BookItem } from './services/knowledgeApi';
import { audioApi } from './services/audioApi';
import { MediaItem } from './api';
import Navbar from './components/Navbar';
import { useAudio } from './AudioContext';

export default function KnowledgePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { playTrack } = useAudio();
    const initQuery = searchParams.get('q') || '';

    const [input, setInput] = useState(initQuery);
    const [query, setQuery] = useState(initQuery);

    const [wikiData, setWikiData] = useState<WikiArticle | null>(null);
    const [dictData, setDictData] = useState<DictEntry | null>(null);
    const [books, setBooks] = useState<BookItem[]>([]);
    const [mediaResults, setMediaResults] = useState<MediaItem[]>([]);
    const [musicResults, setMusicResults] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('Overview');
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const runMultiSourceSearch = useCallback(async (q: string) => {
        if (!q.trim()) return;
        setLoading(true);
        setWikiData(null); setDictData(null); setBooks([]); setMediaResults([]); setMusicResults([]);

        const [wikiRes, dictRes, booksRes, mediaRes, musicRes] = await Promise.allSettled([
            knowledgeApi.fetchWikipedia(q),
            knowledgeApi.fetchDictionary(q),
            knowledgeApi.fetchBooks(q),
            knowledgeApi.fetchRelatedMedia(q),
            audioApi.searchSongs(q),
        ]);

        if (wikiRes.status === 'fulfilled') setWikiData(wikiRes.value);
        if (dictRes.status === 'fulfilled') setDictData(dictRes.value);
        if (booksRes.status === 'fulfilled') setBooks(booksRes.value);
        if (mediaRes.status === 'fulfilled') setMediaResults(mediaRes.value);
        if (musicRes.status === 'fulfilled') setMusicResults((musicRes.value || []).slice(0, 6));

        setLoading(false);
    }, []);

    useEffect(() => {
        if (query) runMultiSourceSearch(query);
    }, [query, runMultiSourceSearch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setQuery(input.trim());
        setSearchParams({ q: input.trim() });
    };

    const scrollToSection = (heading: string) => {
        sectionRefs.current[heading]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(heading);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <Navbar />

            {/* ── STICKY SEARCH HEADER ── */}
            <div style={{
                position: 'sticky', top: 60, zIndex: 40,
                background: 'rgba(11,13,18,0.96)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border)', padding: '14px 32px'
            }}>
                <form onSubmit={handleSubmit} style={{ maxWidth: 840, margin: '0 auto', display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <BookOpen size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Search concepts, history, science, films, people (e.g. Interstellar, Renaissance, Quantum)..."
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '12px 42px 12px 46px',
                                background: 'rgba(24,27,34,0.9)', backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border-glow)', borderRadius: 14,
                                color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {loading && <Loader2 size={16} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />}
                    </div>
                    <button type="submit" className="btn btn-accent" style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Search size={15} /> Research
                    </button>
                </form>
            </div>

            {/* ── EMPTY STATE DISCOVERY ── */}
            {!query && (
                <div style={{ maxWidth: 680, margin: '80px auto', textAlign: 'center', padding: '0 32px' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#F8FAFC', marginBottom: 10, letterSpacing: '-0.02em' }}>
                        Aura Knowledge Engine
                    </h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6 }}>
                        Multi-source deep research aggregation combining Wikipedia articles, Open Library publications, Free Dictionary audio phonetics, and StreamX Media cross-referencing.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 32 }}>
                        {['Christopher Nolan', 'Black Holes', 'Renaissance', 'Quantum Computing', 'Sherlock Holmes', 'Artificial Intelligence'].map(s => (
                            <button
                                key={s}
                                onClick={() => { setInput(s); setQuery(s); setSearchParams({ q: s }); }}
                                style={{
                                    padding: '8px 18px', borderRadius: 999, background: 'var(--surface)',
                                    border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 3-COLUMN RESEARCH CANVAS ── */}
            {query && (
                <div style={{ display: 'flex', maxWidth: 1380, margin: '0 auto', padding: '32px 24px', gap: 32 }}>

                    {/* ── LEFT COLUMN: STICKY TOC SIDEBAR ── */}
                    {wikiData?.sections && wikiData.sections.length > 0 && (
                        <aside style={{
                            width: 220, flexShrink: 0, position: 'sticky', top: 140, alignSelf: 'flex-start',
                            display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto'
                        }} className="scrollbar-hide">
                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>
                                Contents
                            </p>
                            {wikiData.sections.map(sec => (
                                <button
                                    key={sec.heading}
                                    onClick={() => scrollToSection(sec.heading)}
                                    style={{
                                        textAlign: 'left', padding: '7px 12px',
                                        borderRadius: 8, border: 'none', cursor: 'pointer',
                                        fontSize: 13, fontWeight: activeSection === sec.heading ? 800 : 500,
                                        color: activeSection === sec.heading ? 'var(--accent)' : 'var(--text-3)',
                                        background: activeSection === sec.heading ? 'rgba(99,102,241,0.12)' : 'transparent',
                                        transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 6
                                    }}
                                >
                                    {activeSection === sec.heading && <ChevronRight size={12} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.heading}</span>
                                </button>
                            ))}
                        </aside>
                    )}

                    {/* ── CENTER COLUMN: ARTICLE CANVAS ── */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                        {/* Article Banner Header */}
                        {wikiData && (
                            <div style={{ marginBottom: 36 }}>
                                <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
                                    {wikiData.title}
                                </h1>
                                <a href={wikiData.fullurl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                                    <ExternalLink size={13} /> View on Wikipedia
                                </a>
                            </div>
                        )}

                        {/* Main Image Banner with Lightbox Trigger */}
                        {wikiData?.thumbnail && (
                            <div
                                onClick={() => setLightboxImg(wikiData.thumbnail!)}
                                style={{
                                    position: 'relative', width: '100%', maxHeight: 380, borderRadius: 16,
                                    overflow: 'hidden', marginBottom: 32, cursor: 'pointer', background: 'var(--surface-elevated)'
                                }}
                            >
                                <img src={wikiData.thumbnail} alt={wikiData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(11,13,18,0.8)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 8, fontSize: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                    <Maximize2 size={13} /> Expand Gallery
                                </div>
                            </div>
                        )}

                        {/* Article Sections Render */}
                        {wikiData?.sections.map(sec => (
                            <div
                                key={sec.heading}
                                ref={el => { sectionRefs.current[sec.heading] = el; }}
                                style={{ marginBottom: 36 }}
                            >
                                {sec.heading !== 'Overview' && (
                                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', marginBottom: 14, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                        {sec.heading}
                                    </h2>
                                )}
                                <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.85, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                    {sec.body}
                                </p>
                            </div>
                        ))}

                        {/* ── Watch Related Media Carousel ── */}
                        {mediaResults.length > 0 && (
                            <div style={{ marginTop: 48, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <Film size={18} style={{ color: 'var(--accent)' }} />
                                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC' }}>
                                        Watch Related Media on Aura
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12 }} className="scrollbar-hide">
                                    {mediaResults.map(item => (
                                        <div
                                            key={item.tmdb_id}
                                            onClick={() => navigate(`/${item.type}/${item.tmdb_id}`)}
                                            style={{
                                                width: 140, flexShrink: 0, background: 'var(--surface)', borderRadius: 12,
                                                overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer',
                                                transition: 'transform 0.2s ease', position: 'relative'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                        >
                                            <div style={{ height: 195, background: 'var(--surface-3)', position: 'relative' }}>
                                                {item.poster ? (
                                                    <img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Play size={28} style={{ color: 'var(--text-3)' }} />
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Play size={15} style={{ fill: '#fff', color: '#fff', marginLeft: 2 }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '8px 10px' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.title}
                                                </div>
                                                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
                                                    Watch Now
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Listen to Related Music Cards ── */}
                        {musicResults.length > 0 && (
                            <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <Music2 size={18} style={{ color: 'var(--accent)' }} />
                                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#F8FAFC' }}>
                                        Listen to Soundtracks & Music
                                    </h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                    {musicResults.map(track => (
                                        <div
                                            key={track.id}
                                            onClick={() => playTrack(track)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                                                borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)',
                                                cursor: 'pointer', transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                                        >
                                            <img src={track.artworkUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {track.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {track.artist}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: INFOBOX & DICTIONARY & BOOKS ── */}
                    <aside style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Dictionary Phonetics Card */}
                        {dictData && (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-glow)', borderRadius: 16, padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <BookMarked size={16} style={{ color: 'var(--accent)' }} />
                                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#F8FAFC' }}>Dictionary Definition</h3>
                                    </div>
                                    {dictData.audioUrl && (
                                        <button
                                            onClick={() => { const a = new Audio(dictData.audioUrl); a.play(); }}
                                            style={{ padding: 6, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--border-glow)', color: 'var(--accent)', cursor: 'pointer', display: 'flex' }}
                                            title="Listen to pronunciation"
                                        >
                                            <Volume2 size={15} />
                                        </button>
                                    )}
                                </div>
                                {dictData.phonetic && (
                                    <div style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', marginBottom: 12 }}>
                                        {dictData.phonetic}
                                    </div>
                                )}
                                {dictData.meanings.slice(0, 2).map((m, i) => (
                                    <div key={i} style={{ marginBottom: 12 }}>
                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                                            {m.partOfSpeech}
                                        </span>
                                        {m.definitions.slice(0, 2).map((d, j) => (
                                            <p key={j} style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 4 }}>
                                                • {d.definition}
                                            </p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* At A Glance Quick Facts */}
                        {wikiData && (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <Info size={16} style={{ color: 'var(--accent)' }} />
                                    <h3 style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC' }}>At a Glance</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {wikiData.infoboxProps.map(prop => (
                                        <div key={prop.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--surface-3)', paddingBottom: 6 }}>
                                            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{prop.key}</span>
                                            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{prop.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Open Library Books & Publications */}
                        {books.length > 0 && (
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <Library size={16} style={{ color: 'var(--accent)' }} />
                                    <h3 style={{ fontSize: 15, fontWeight: 900, color: '#F8FAFC' }}>Related Literature</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {books.map(b => (
                                        <div key={b.key} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            {b.coverUrl ? (
                                                <img src={b.coverUrl} alt="" style={{ width: 36, height: 50, borderRadius: 4, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 36, height: 50, background: 'var(--surface-3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <BookOpen size={16} style={{ color: 'var(--text-3)' }} />
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {b.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {b.author} {b.firstPublishYear ? `(${b.firstPublishYear})` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* ── LIGHTBOX IMAGE MODAL ── */}
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 2000,
                        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32
                    }}
                >
                    <img src={lightboxImg} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 0 40px rgba(0,0,0,0.8)' }} />
                    <button onClick={() => setLightboxImg(null)} className="btn-icon" style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)' }}>
                        <X size={24} />
                    </button>
                </div>
            )}
        </div>
    );
}
