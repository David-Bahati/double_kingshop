/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#7B3FF2', dark: '#5B2CC9', light: '#9B6FF5' },
        secondary: { DEFAULT: '#FFD700', dark: '#D4AF37', light: '#FFE55C' },
        pi: { DEFAULT: '#6C5CE7', hover: '#5B4CDB' },
        card: '#1e293b',
        sidebar: '#0f172a',
        background: '#020617'
      }
    },
  },
  plugins: [],
}