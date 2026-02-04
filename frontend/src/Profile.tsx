import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, User as UserIcon } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();

    const profiles = [
        { name: 'Admin', color: 'bg-brand' },
        { name: 'Guest', color: 'bg-blue-600' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="min-h-screen bg-dark text-white flex flex-col items-center justify-center p-8 overflow-hidden"
        >
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold mb-16 tracking-tight"
            >
                Who's watching?
            </motion.h1>

            <div className="flex flex-wrap justify-center gap-12">
                {profiles.map((p, i) => (
                    <motion.div
                        key={p.name}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate('/')}
                        className="group flex flex-col items-center gap-6 cursor-pointer"
                    >
                        <div className={`w-40 h-40 rounded-2xl ${p.color} flex items-center justify-center overflow-hidden border-4 border-transparent group-hover:border-white group-hover:scale-105 transition-all duration-300 shadow-2xl`}>
                            <UserIcon className="w-20 h-20 text-white/50 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-white/50 group-hover:text-white text-2xl font-medium transition-colors tracking-wide">
                            {p.name}
                        </span>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: profiles.length * 0.1 }}
                    className="group flex flex-col items-center gap-6 cursor-pointer"
                >
                    <div className="w-40 h-40 rounded-2xl bg-white/5 flex items-center justify-center border-4 border-transparent group-hover:bg-white/10 group-hover:border-white/30 group-hover:scale-105 transition-all duration-300 shadow-2xl">
                        <Plus className="w-16 h-16 text-white/20 group-hover:text-white/60 transition-colors" />
                    </div>
                    <span className="text-white/20 group-hover:text-white/60 text-2xl font-medium transition-colors tracking-wide">Add Profile</span>
                </motion.div>
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 px-10 py-3 border border-white/20 text-white/40 rounded-lg hover:text-white hover:border-white transition-all tracking-widest text-sm uppercase font-bold"
            >
                Manage Profiles
            </motion.button>
        </motion.div>
    );
}
