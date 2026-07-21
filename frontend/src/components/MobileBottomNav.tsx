import { useNavigate, useLocation } from 'react-router-dom';
import { Film, BookOpen, Music2, User } from 'lucide-react';

export default function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { label: 'Video', path: '/', icon: Film },
        { label: 'Knowledge', path: '/knowledge', icon: BookOpen },
        { label: 'Audio', path: '/audio', icon: Music2 },
        { label: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
            background: 'rgba(11,13,18,0.96)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)', padding: '8px 16px',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center'
        }} className="mobile-only-nav">
            {items.map(item => {
                const Icon = item.icon;
                const isActive = item.path === '/'
                    ? !location.pathname.startsWith('/knowledge') && !location.pathname.startsWith('/audio') && !location.pathname.startsWith('/profile')
                    : location.pathname.startsWith(item.path);

                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: isActive ? 'var(--accent)' : 'var(--text-3)',
                            fontSize: 11, fontWeight: isActive ? 800 : 500,
                            transition: 'color 0.15s ease'
                        }}
                    >
                        <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
