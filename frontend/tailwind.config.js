/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#f7f8fa',
        'bg-secondary': '#ffffff',
        'bg-card': '#ffffff',
        'border-glass': '#e5e8ee',
        'primary': '#4f46e5',
        'primary-dark': '#4338ca',
        'primary-light': '#6366f1',
        'secondary': '#0891b2',
        'accent': '#d97706',
        'success': '#059669',
        'danger': '#dc2626',
        'text-primary': '#101828',
        'text-secondary': '#5c667a',
        'text-muted': '#98a2b3',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 rgba(79, 70, 229, 0.15)' },
          '50%': { boxShadow: '0 0 12px rgba(79, 70, 229, 0.25)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slideInRight': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
        'gradient-button': 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-gold': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-purple': 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
      },
      boxShadow: {
        'glow-purple': '0 4px 14px rgba(79, 70, 229, 0.22)',
        'glow-cyan': '0 4px 14px rgba(8, 145, 178, 0.22)',
        'glow-green': '0 4px 14px rgba(5, 150, 105, 0.20)',
        'glow-red': '0 4px 14px rgba(220, 38, 38, 0.20)',
        'glow-gold': '0 4px 14px rgba(217, 119, 6, 0.20)',
        'card': '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
        'card-hover': '0 4px 12px rgba(16,24,40,0.08), 0 10px 24px rgba(16,24,40,0.08)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '24px',
      },
    },
  },
  plugins: [],
}
