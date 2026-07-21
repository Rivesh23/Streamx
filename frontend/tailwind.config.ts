/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand': '#6366F1',
                'brand-hover': '#4F46E5',
                'brand-glow': 'rgba(99, 102, 241, 0.25)',
                'dark': '#0B0D12',
                'obsidian': '#0B0D12',
                'surface-elevated': '#111318',
                'charcoal': '#181B22',
                'charcoal-elevated': '#1E222D',
                'glass-white': 'rgba(255, 255, 255, 0.08)',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'glass-dark': 'rgba(11, 13, 18, 0.8)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'cinematic': '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
                'poster-lift': '0 12px 32px -8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.15)',
            },
        },
    },
    plugins: [],
}
