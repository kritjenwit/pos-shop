/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Rubik', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#111111',
          hover: '#000000',
          light: '#333333',
          50: '#F5F5F5',
          100: '#E5E5E5',
        },
        accent: '#333333',
        danger: '#EF4444',
        background: '#F5F5F5',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0,0,0,0.07)',
        modal: '0 10px 15px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
