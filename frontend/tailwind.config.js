/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aviation: {
          dark: '#0b1120',
          panel: '#111c33',
          card: '#162444',
          border: '#1f335e',
          accent: '#38bdf8',
          blue: '#2563eb',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          rose: '#f43f5e',
          emerald: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
