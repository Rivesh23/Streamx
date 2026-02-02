import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login
        localStorage.setItem('auth_token', 'demo_token');
        navigate('/');
    };

    return (
        <div className="h-screen w-full bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center relative flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" />

            <div className="bg-black/75 p-16 rounded-md w-full max-w-md relative z-10">
                <h1 className="text-3xl font-bold mb-8 text-white">Sign In</h1>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email or phone number"
                        className="p-4 rounded bg-[#333] text-white outline-none focus:bg-[#454545]"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="p-4 rounded bg-[#333] text-white outline-none focus:bg-[#454545]"
                        defaultValue="password"
                    />
                    <button className="bg-red-600 text-white font-bold py-4 rounded mt-4 hover:bg-red-700 transition">
                        Sign In
                    </button>
                </form>
                <p className="text-gray-400 mt-4">
                    New to IronGate? <span className="text-white hover:underline cursor-pointer">Sign up now</span>.
                </p>
            </div>
        </div>
    );
}
