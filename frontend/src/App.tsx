import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { WifiOff } from 'lucide-react';

import { DeviceProvider, useDevice } from './DeviceContext';
import BootScreen from './BootScreen';
import DeviceSelector from './DeviceSelector';

import Profile from './Profile';
import Home from './Home';
import Login from './Login';
import PhoneHome from './phone/PhoneHome';

function AnimatedRoutes() {
    const location = useLocation();
    const { device } = useDevice();

    // Phone gets its own single-page app with tabs
    if (device === 'phone') {
        return (
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<PhoneHome />} />
                </Routes>
            </AnimatePresence>
        );
    }

    // Laptop & TV mode = desktop UI
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/" element={<Home />} />
                <Route path="/tv" element={<Home category="tv" />} />
                <Route path="/movies" element={<Home category="movie" />} />
                <Route path="/my-list" element={<Home category="list" />} />
            </Routes>
        </AnimatePresence>
    );
}

function AppContent() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [booted, setBooted] = useState(() => {
        // Only show boot screen once per browser session
        return sessionStorage.getItem('aethernex_booted') === 'true';
    });
    const { device } = useDevice();

    const handleBootComplete = useCallback(() => {
        setBooted(true);
        sessionStorage.setItem('aethernex_booted', 'true');
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Phase 1: Boot screen (once per session)
    if (!booted) {
        return <BootScreen onComplete={handleBootComplete} />;
    }

    // Phase 2: Device selection (persisted in localStorage)
    if (!device) {
        return <DeviceSelector />;
    }

    // Phase 3: Main app
    return (
        <Router>
            {isOffline && (
                <div className="fixed top-0 left-0 w-full bg-[#E50914] text-white text-center py-2 z-[999] font-bold text-sm flex items-center justify-center gap-2 shadow-xl">
                    <WifiOff className="w-4 h-4" /> No Internet Connection
                </div>
            )}
            <AnimatedRoutes />
        </Router>
    );
}

function App() {
    return (
        <DeviceProvider>
            <AppContent />
        </DeviceProvider>
    );
}

export default App;
