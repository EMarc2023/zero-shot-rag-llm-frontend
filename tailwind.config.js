/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      animation: {
        spin: 'spin 1s linear infinite', // Default spin animation
        // ... other animations you might have ...
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bdd7ff',
          300: '#9ec5fe',
          400: '#7ea3fe',
          500: '#5d81fe',
          600: '#4c6efd',
          700: '#3b5bdb',
          800: '#2a49d6',
          900: '#1e3a8a',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        // Add other custom font families here if needed
      },
    },
  },
  plugins: [],
};
