/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14171C',
        paper: '#FAF9F6',
        coral: '#FF5A5F',
        teal: '#0E6B6B',
        sand: '#EFE9DD',
        slate: '#5C6470',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(20, 23, 28, 0.08)',
      },
    },
  },
  plugins: [],
}
