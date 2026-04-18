import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootScreenProps {
    onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
    const [phase, setPhase] = useState<'logo' | 'text' | 'done'>('logo');

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('text'), 800);
        const t2 = setTimeout(() => setPhase('done'), 2200);
        const t3 = setTimeout(() => onComplete(), 2800);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 'done' ? 0 : 1 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[99999] bg-[#040404] flex items-center justify-center overflow-hidden"
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.4, scale: 1.2 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E50914]/10 blur-[120px]"
                />
            </div>

            <div className="relative flex flex-col items-center gap-8">
                {/* Logo mark */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.3, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
                    className="relative"
                >
                    {/* Outer ring */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-gradient-to-br from-[#E50914] via-[#ff2d2d] to-[#8B0000] p-[2px] shadow-[0_0_80px_rgba(229,9,20,0.4)]"
                    >
                        <div className="w-full h-full rounded-[calc(2rem-2px)] bg-[#0a0a0a] flex items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                            >
                                A
                            </motion.span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Brand text */}
                <AnimatePresence>
                    {(phase === 'text' || phase === 'done') && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <h1 className="text-3xl md:text-4xl font-black tracking-[0.15em] text-white">
                                AETHERNEX
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-white/30" />
                                <span className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">
                                    Stream · Watch · Enjoy
                                </span>
                                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-white/30" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4"
                >
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut', delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-[#E50914] to-[#ff6b6b] rounded-full"
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}
