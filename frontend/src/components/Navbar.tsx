import { useState, useEffect, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Heart, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
    onSearch: (query: string) => void;
    activeCategory: string;
    onCategoryChange: (category: any) => void;
}

const Navbar = memo(function Navbar({ onSearch, activeCategory, onCategoryChange }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'all', label: 'Home' },
        { id: 'tv', label: 'TV Shows' },
        { id: 'movie', label: 'Movies' },
        { id: 'list', label: 'My List' }
    ];

    return (
        <div className="fixed top-4 w-full z-50 flex justify-center px-6 pointer-events-none">
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ willChange: 'transform, backdrop-filter, background-color' }}
                className={`
                    flex items-center justify-between px-8 py-4 rounded-3xl transition-all duration-500
                    pointer-events-auto w-full max-w-7xl
                    ${isScrolled ? 'bg-black/40 backdrop-blur-2xl shadow-2xl border border-white/10' : 'bg-transparent'}
                `}
            >
                <div className="flex items-center gap-4">
                    <img
                        src="/logo.png"
                        alt="Aethernex Logo"
                        onClick={() => onCategoryChange('all')}
                        className="h-10 cursor-pointer hover:scale-105 transition-transform"
                    />
                    <span
                        onClick={() => onCategoryChange('all')}
                        className="text-2xl font-black text-brand tracking-tighter cursor-pointer hidden lg:block"
                    >
                        AETHERNEX
                    </span>
                    <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onCategoryChange(item.id)}
                                className={`transition-all duration-300 hover:text-white ${activeCategory === item.id ? 'text-white' : 'text-white/40'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-brand transition-colors" />
                        <input
                            type="text"
                            placeholder="Titles, people, genres"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                onSearch(e.target.value);
                            }}
                            className="bg-white/5 hover:bg-white/10 focus:bg-white/20 border border-white/5 focus:border-brand/40 px-12 py-2.5 rounded-full text-xs w-64 transition-all focus:w-80 outline-none backdrop-blur-3xl"
                        />
                    </div>
                    <button
                        onClick={() => onCategoryChange('favorites')}
                        className={`p-2.5 rounded-full transition-all border ${activeCategory === 'favorites' ? 'bg-brand text-white border-brand shadow-apple-focus' : 'hover:bg-white/10 text-white/60 hover:text-white border-transparent'}`}
                        title="Your Favorites"
                    >
                        <Heart className={`w-5 h-5 transition-all ${activeCategory === 'favorites' ? 'fill-white' : ''}`} />
                    </button>
                    <div
                        onClick={() => {
                            localStorage.removeItem('auth_token');
                            navigate('/login');
                        }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-red-900 flex items-center justify-center cursor-pointer border-2 border-white/10 hover:border-brand transition-all shadow-lg active:scale-95"
                        title="Logout"
                    >
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </motion.nav>
        </div>
    );
});

export default Navbar;
