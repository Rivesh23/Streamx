import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string | number;
    onChange: (value: any) => void;
    className?: string;
    direction?: 'up' | 'down';
}

export default function CustomDropdown({ options, value, onChange, className = "", direction = 'down' }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 transition-all hover:text-white/80 ${className.includes('bg-transparent') ? className : 'liquid-blur px-4 py-2 rounded-lg text-sm font-bold border border-white/10 min-w-[120px] hover:bg-white/10'}`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? (direction === 'up' ? 'rotate-0' : 'rotate-180') : (direction === 'up' ? 'rotate-180' : 'rotate-0')}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
                        className={`absolute right-0 ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} z-[300] min-w-full bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl`}
                    >
                        <div className="max-h-64 overflow-y-auto scrollbar-hide py-2">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/10 ${value === option.value ? 'text-[#E50914] font-black bg-white/5' : 'text-white/80'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
