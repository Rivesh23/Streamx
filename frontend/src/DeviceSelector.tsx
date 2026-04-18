import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Tv, ChevronRight, Sparkles } from 'lucide-react';
import { useDevice, DeviceMode } from './DeviceContext';

const DEVICES = [
    {
        id: 'phone' as DeviceMode,
        label: 'Phone',
        description: 'Optimized for touch & one-hand use',
        icon: Smartphone,
        gradient: 'from-violet-600 to-indigo-700',
        glow: 'shadow-violet-500/30',
        accent: '#8B5CF6',
    },
    {
        id: 'laptop' as DeviceMode,
        label: 'Laptop',
        description: 'Full desktop experience with keyboard shortcuts',
        icon: Monitor,
        gradient: 'from-sky-500 to-blue-700',
        glow: 'shadow-sky-500/30',
        accent: '#0EA5E9',
    },
    {
        id: 'tv' as DeviceMode,
        label: 'TV',
        description: 'Lean-back cinematic viewing with large visuals',
        icon: Tv,
        gradient: 'from-amber-500 to-orange-700',
        glow: 'shadow-amber-500/30',
        accent: '#F59E0B',
    },
];

export default function DeviceSelector() {
    const { setDevice } = useDevice();
    const [hovered, setHovered] = useState<DeviceMode>(null);
    const [selected, setSelected] = useState<DeviceMode>(null);

    const handleSelect = (device: DeviceMode) => {
        setSelected(device);
        // Animate out, then commit
        setTimeout(() => {
            setDevice(device);
        }, 600);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden select-none"
        >
            {/* Animated background mesh */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-spin" style={{ animationDuration: '120s' }}>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-900/10 blur-[150px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sky-900/10 blur-[150px]" />
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-amber-900/10 blur-[150px]" />
                </div>
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Content */}
            <AnimatePresence mode="wait">
                {!selected ? (
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 flex flex-col items-center px-6 max-w-4xl w-full"
                    >
                        {/* Logo / Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 uppercase tracking-[0.3em] mb-6">
                                <Sparkles className="w-3 h-3 text-[#E50914]" />
                                Aethernex
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                                How are you watching?
                            </h1>
                            <p className="text-lg text-white/40 font-medium max-w-md mx-auto">
                                Choose your device for the best experience
                            </p>
                        </motion.div>

                        {/* Device cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {DEVICES.map((device, i) => {
                                const Icon = device.icon;
                                const isHovered = hovered === device.id;

                                return (
                                    <motion.button
                                        key={device.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 100 }}
                                        onMouseEnter={() => setHovered(device.id)}
                                        onMouseLeave={() => setHovered(null)}
                                        onClick={() => handleSelect(device.id)}
                                        className={`
                                            group relative flex flex-col items-center p-10 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden
                                            ${isHovered
                                                ? `border-white/20 bg-white/[0.04] shadow-2xl ${device.glow} scale-[1.03]`
                                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                                            }
                                        `}
                                    >
                                        {/* Glow background on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-b ${device.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700 rounded-3xl`} />

                                        {/* Icon container */}
                                        <div className={`
                                            relative w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500
                                            ${isHovered
                                                ? `bg-gradient-to-br ${device.gradient} shadow-xl ${device.glow}`
                                                : 'bg-white/[0.05]'
                                            }
                                        `}>
                                            <Icon className={`w-10 h-10 transition-colors duration-500 ${isHovered ? 'text-white' : 'text-white/40'}`} strokeWidth={1.5} />
                                        </div>

                                        {/* Label */}
                                        <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-white/70'}`}>
                                            {device.label}
                                        </h2>
                                        <p className={`text-sm text-center transition-colors duration-300 ${isHovered ? 'text-white/50' : 'text-white/25'}`}>
                                            {device.description}
                                        </p>

                                        {/* Arrow indicator on hover */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                                            className="mt-6"
                                        >
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: device.accent }}>
                                                Continue <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </motion.div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="transition"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${DEVICES.find(d => d.id === selected)?.gradient} flex items-center justify-center shadow-2xl`}>
                            {(() => {
                                const d = DEVICES.find(d => d.id === selected);
                                if (!d) return null;
                                const Icon = d.icon;
                                return <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />;
                            })()}
                        </div>
                        <p className="text-xl font-bold text-white">Loading {DEVICES.find(d => d.id === selected)?.label} UI...</p>
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className="h-full bg-[#E50914] rounded-full"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
