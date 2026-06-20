/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables class-based dark mode toggles
  theme: {
    extend: {
      colors: {
        forest: {
          light: '#F4F7F5',
          dark: '#0B130E',
          surface: '#13221B',
        },
        sage: '#8B9A93',
        emerald: {
          500: '#10B981',
          800: '#065F46',
        }
      },
      fontFamily: {
        headings: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
