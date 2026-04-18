import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './api';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const res = await api.login({ username, password });
                localStorage.setItem('auth_token', res.access_token);
                localStorage.setItem('user_id', res.user_id);
                navigate('/profile');
            } else {
                const res = await api.register({ username, password });
                localStorage.setItem('auth_token', res.access_token);
                localStorage.setItem('user_id', res.user_id);
                navigate('/profile');
            }
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                setError(detail);
            } else if (Array.isArray(detail) && detail.length > 0) {
                setError(detail[0].msg || 'Invalid input');
            } else {
                setError('Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040404] flex items-center justify-center relative overflow-hidden px-4">
            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[#E50914]/5 blur-[200px] -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[150px]" />
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-6"
                    >
                        <Sparkles className="w-3 h-3 text-[#E50914]" />
                        StreamX
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isLogin ? 'login' : 'register'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                                {isLogin ? 'Welcome back' : 'Create account'}
                            </h1>
                            <p className="text-sm text-white/35 font-medium">
                                {isLogin ? 'Sign in to continue watching' : 'Start your streaming journey'}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Form Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl p-8 md:p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-sm text-white font-medium outline-none focus:border-[#E50914]/50 focus:bg-white/[0.06] transition-all placeholder:text-white/15"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-12 py-3.5 text-sm text-white font-medium outline-none focus:border-[#E50914]/50 focus:bg-white/[0.06] transition-all placeholder:text-white/15"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-[#E50914] text-xs font-bold bg-[#E50914]/10 border border-[#E50914]/20 px-4 py-2.5 rounded-xl"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#E50914] hover:bg-[#f40612] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 mt-2 shadow-lg shadow-[#E50914]/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Skip login (go directly as guest) */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                    >
                        Continue as Guest
                    </button>
                </div>

                {/* Toggle */}
                <div className="mt-8 text-center text-sm text-white/30">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-white font-bold hover:text-[#E50914] transition-colors">
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
