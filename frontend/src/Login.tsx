import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './api';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const data = await api.login({ email, password });
            localStorage.setItem('auth_token', data.access_token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full bg-[#050505] relative flex items-center justify-center overflow-hidden font-['Outfit']"
        >
            {/* Premium Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.4, 0.3],
                        rotate: [0, 45, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand/10 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, -45, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/10 blur-[150px] rounded-full"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-lg p-12 relative z-10"
            >
                <div className="text-center mb-12">
                    <img
                        src="/logo.png"
                        alt="Aethernex Logo"
                        className="h-24 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(229,9,20,0.3)]"
                    />
                    <p className="text-white/40 font-medium tracking-wide uppercase text-[10px]">The Future of Cinema</p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-apple-focus">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    className="flex items-center gap-3 bg-brand/10 border border-brand/20 p-4 rounded-2xl text-brand text-xs font-black tracking-wide uppercase mb-2 shadow-lg overflow-hidden"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 ml-8 block">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/input:text-brand transition-colors z-10" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="auth-input auth-input-with-icon"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 ml-8 block">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/input:text-brand transition-colors z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="auth-input auth-input-with-icon pr-16"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors text-white/20 hover:text-white z-10"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full bg-white text-black font-black py-6 rounded-[2.5rem] mt-10 hover:bg-brand hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg tracking-tight">Sign Into Aethernex</span>
                                    <motion.span
                                        className="text-xl"
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        →
                                    </motion.span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-white/20 text-xs font-medium">
                            New to Aethernex?{' '}
                            <button className="text-white hover:text-brand font-black transition-colors ml-1 uppercase tracking-tighter">
                                Request Access
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
