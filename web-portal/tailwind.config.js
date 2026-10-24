/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#040605',
          900: '#070b09',
          800: '#0b120e',
          700: '#111c16',
          border: '#17281f',
          borderBright: '#234231',
        },
        signal: {
          DEFAULT: '#00e575',
          hover: '#19ff8c',
          dim: '#052e18',
          muted: '#10b981',
          warn: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
