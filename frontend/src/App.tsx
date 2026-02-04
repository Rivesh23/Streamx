import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Profile from './Profile';
import Home from './Home';

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* <Route path="/login" element={<Login />} /> Removed login route */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/" element={<Home />} />
                <Route path="/tv" element={<Home category="tv" />} />
                <Route path="/movies" element={<Home category="movie" />} />
                <Route path="/my-list" element={<Home category="list" />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default App;
