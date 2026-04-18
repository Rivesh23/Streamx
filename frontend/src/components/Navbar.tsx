import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, User, Menu, X, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
    onSearch: (query: string) => void;
    activeCategory: string;
    onCategoryChange: (category: any) => void;
}

const Navbar = memo(function Navbar({ onSearch, activeCategory, onCategoryChange }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('recent_searches');
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)); } catch (e) {}
        }
    }, []);

    const saveSearch = (query: string) => {
        if (!query.trim()) return;
        const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recent_searches', JSON.stringify(updated));
    };

    const clearSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recent_searches');
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            }
        };
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const navItems = [
        { id: 'all', label: 'Home' },
        { id: 'tv', label: 'TV Shows' },
        { id: 'movie', label: 'Movies' },
        { id: 'list', label: 'My List' }
    ];

    const handleCategoryClick = (id: string) => {
        onCategoryChange(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="fixed top-0 md:top-4 w-full z-50 flex justify-center px-0 md:px-6 pointer-events-none">
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ willChange: 'transform, backdrop-filter, background-color' }}
                className={`
                    flex items-center justify-between px-6 md:px-8 py-3 md:py-4 transition-all duration-500
                    pointer-events-auto w-full max-w-6xl md:rounded-full border border-transparent
                    ${isScrolled || isMobileMenuOpen ? 'bg-black/70 backdrop-blur-3xl shadow-2xl border-white/10 md:mt-4 md:shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-transparent'}
                `}
            >
                <div className="flex items-center gap-4 lg:gap-8">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleCategoryClick('all')}
                    >
                        <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-brand via-brand-hover to-red-900 shadow-[0_0_20px_rgba(229,9,20,0.4)] group-hover:shadow-[0_0_30px_rgba(229,9,20,0.8)] transition-all duration-300">
                            {/* IronGate Symbol */}
                            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4v10m-4-6h8" />
                            </svg>
                            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xl md:text-2xl font-black tracking-tighter hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50 drop-shadow-sm group-hover:from-white group-hover:to-white transition-all">
                            IRONGATE
                        </span>
                    </div>
                    <div className="hidden md:flex gap-6 lg:gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleCategoryClick(item.id)}
                                aria-label={`View ${item.label}`}
                                className={`transition-all duration-300 hover:text-white relative py-2 ${activeCategory === item.id ? 'text-white' : 'text-white/40'}`}
                            >
                                {item.label}
                                {activeCategory === item.id && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-0 w-full h-0.5 bg-brand"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <div className="relative group hidden sm:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-brand transition-colors" />
                        <input
                            id="global-search-input"
                            type="text"
                            placeholder="Search titles... (Press '/')"
                            aria-label="Search titles"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                onSearch(e.target.value);
                            }}
                            onFocus={() => setShowSearchHistory(true)}
                            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSearch(searchQuery);
                            }}
                            className="bg-white/5 hover:bg-white/10 focus:bg-white/20 border border-white/5 focus:border-brand/40 px-12 py-2 rounded-full text-xs w-48 lg:w-64 transition-all focus:w-64 lg:focus:w-80 outline-none backdrop-blur-3xl"
                        />
                        <AnimatePresence>
                            {showSearchHistory && recentSearches.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full right-0 mt-4 w-full md:w-64 bg-surface/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 pointer-events-auto"
                                >
                                    <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <span>Recent</span>
                                        <button onClick={clearSearches} className="hover:text-white transition-colors"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                    <div className="space-y-2">
                                        {recentSearches.map((term, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => {
                                                    setSearchQuery(term);
                                                    onSearch(term);
                                                    setShowSearchHistory(false);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer text-xs font-bold transition-colors"
                                            >
                                                <History className="w-3.5 h-3.5 text-white/40" />
                                                <span>{term}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <button
                        onClick={() => handleCategoryClick('favorites')}
                        aria-label="View Favorites"
                        className={`p-2.5 rounded-full transition-all border ${activeCategory === 'favorites' ? 'bg-brand text-white border-brand shadow-apple-focus' : 'hover:bg-white/10 text-white/60 hover:text-white border-transparent'}`}
                    >
                        <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-all ${activeCategory === 'favorites' ? 'fill-white' : ''}`} />
                    </button>

                    <div
                        onClick={() => {
                            localStorage.removeItem('auth_token');
                            navigate('/login');
                        }}
                        aria-label="User Profile"
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand to-red-900 flex items-center justify-center cursor-pointer border-2 border-white/10 hover:border-brand transition-all shadow-lg active:scale-95"
                    >
                        <User className="w-4 h-4 md:w-5 md:h-5" />
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 md:hidden text-white/60 hover:text-white"
                        aria-label="Toggle Mobile Menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl md:hidden border-t border-white/10 pointer-events-auto overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-6">
                            <div className="relative group w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search titles..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        onSearch(e.target.value);
                                    }}
                                    className="bg-white/5 border border-white/10 px-12 py-3 rounded-xl text-sm w-full outline-none"
                                />
                            </div>
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleCategoryClick(item.id)}
                                    className={`text-left text-lg font-black uppercase tracking-[0.2em] py-2 transition-colors ${activeCategory === item.id ? 'text-brand' : 'text-white/40'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default Navbar;
