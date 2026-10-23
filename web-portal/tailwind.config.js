/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orbit: {
          dark: '#080a0f',
          panel: '#10141e',
          card: '#161c2b',
          accent: '#3b82f6',
          cyan: '#06b6d4',
          orange: '#f97316',
          emerald: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
