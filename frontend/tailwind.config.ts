/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand': '#8b5cf6',
                'brand-hover': '#7c3aed',
                'dark': '#0c0c0c',
                'surface': '#1c1c1e', // Apple-style surface gray
                'glass-white': 'rgba(255, 255, 255, 0.08)',
                'glass-dark': 'rgba(0, 0, 0, 0.4)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'apple-lift': '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 18px 36px -18px rgba(0, 0, 0, 0.5)',
                'apple-focus': '0 0 0 4px rgba(255, 255, 255, 0.2), 0 30px 60px -12px rgba(0, 0, 0, 0.7)',
            },
            backgroundImage: {
                'liquid-gradient': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(12, 12, 12, 0.9) 100%)',
                'apple-mask': 'linear-gradient(to bottom, transparent, #0c0c0c 95%)',
            },
        },
    },
    plugins: [],
}
