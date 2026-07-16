/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sanatorio-blue': '#003B82',
        'sanatorio-pink': '#E6397B',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        condensed: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
