/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0f172a', // Slate 900 (Main Text/Bg)
                    light: '#334155',   // Slate 700
                    dark: '#020617',    // Slate 950
                    // Keep existing spread for compatibility if needed
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                accent: {
                    DEFAULT: '#10b981', // Emerald 500
                    hover: '#059669',
                    light: '#d1fae5',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    muted: '#f8fafc', // Slate 50
                },
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
            }
        },
    },
    plugins: [],
}
