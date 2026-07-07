import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

export default function Login() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const fn = mode === 'login' ? api.login : api.register;
            const res = await fn({ username, password });
            if (res.access_token) {
                localStorage.setItem('auth_token', res.access_token);
                localStorage.setItem('user_id', res.user_id);
            }
            navigate('/');
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 28 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ADE80' }} />
                    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                        StreamX
                    </span>
                </div>

                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28 }}>
                    {mode === 'login'
                        ? 'Sign in to continue watching'
                        : 'Start your streaming journey'}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
                            Username
                        </label>
                        <input
                            className="input"
                            type="text"
                            placeholder="e.g. johndoe"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
                            Password
                        </label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: 8,
                            fontSize: 13,
                            color: '#B91C1C',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '11px 18px' }}
                    >
                        {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-2)' }}>
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                        style={{ fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'underline' }}
                    >
                        {mode === 'login' ? 'Register' : 'Sign in'}
                    </button>
                </div>

                {/* Skip button for local use */}
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 13 }}
                >
                    Continue without signing in
                </button>
            </div>
        </div>
    );
}
