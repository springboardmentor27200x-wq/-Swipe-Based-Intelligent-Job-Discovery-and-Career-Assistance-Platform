/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F1",
        ink: "#14171F",
        signal: "#FF5A3C",
        "signal-dark": "#E14526",
        match: "#1AC98E",
        slate: {
          850: "#1B1E27",
        },
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 60px -15px rgba(20, 23, 31, 0.25)",
      },
    },
  },
  plugins: [],
};
