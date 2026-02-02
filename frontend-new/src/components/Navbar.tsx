import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
    onSearch: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val);
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 px-8 py-4 flex items-center justify-between ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
                }`}
        >
            <div className="flex items-center gap-8">
                <h1 className="text-red-600 text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => navigate('/')}>IRONGATE</h1>
                <ul className="flex gap-4 text-sm text-gray-300">
                    <li className="hover:text-white cursor-pointer transition" onClick={() => navigate('/')}>Home</li>
                    <li className="hover:text-white cursor-pointer transition" onClick={() => navigate('/tv')}>TV Shows</li>
                    <li className="hover:text-white cursor-pointer transition" onClick={() => navigate('/movies')}>Movies</li>
                    <li className="hover:text-white cursor-pointer transition" onClick={() => navigate('/my-list')}>My List</li>
                </ul>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative flex items-center group">
                    <Search
                        className="w-5 h-5 text-gray-300 group-focus-within:text-white transition cursor-pointer"
                        onClick={() => inputRef.current?.focus()}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search titles..."
                        value={query}
                        onChange={handleSearchChange}
                        className="bg-transparent border-b border-transparent focus:border-white outline-none ml-2 text-sm w-0 group-focus-within:w-64 focus:w-64 transition-all duration-300 text-white placeholder-gray-500"
                    />
                </div>
                <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transition" />
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
                    <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                        {localStorage.getItem('avatar') ? (
                            <img src={localStorage.getItem('avatar')!} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
