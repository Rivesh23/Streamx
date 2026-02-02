import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Profile from './Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/" element={<Home category="all" />} />
        <Route path="/tv" element={<Home category="tv" />} />
        <Route path="/movies" element={<Home category="movie" />} />
        <Route path="/my-list" element={<Home category="list" />} />
      </Routes>
    </Router>
  );
}
