/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#080C14',
          slate: '#0F172A',
          card: '#131C2E',
          cardLight: '#FFFFFF',
          border: '#1E293B',
          borderLight: '#E2E8F0',
          amber: '#F59E0B',
          amberHover: '#D97706',
          rose: '#EF4444',
          roseHover: '#DC2626',
          emerald: '#10B981',
          chai: '#E07A5F'
        }
      },
      fontFamily: {
        heading: ['"Baloo 2"', '"Noto Sans Devanagari"', 'cursive', 'sans-serif'],
        sans: ['"Poppins"', '"Inter"', '"Noto Sans Devanagari"', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'pill': '0 10px 25px -5px rgba(245, 158, 11, 0.4), 0 8px 10px -6px rgba(245, 158, 11, 0.2)'
      }
    },
  },
  plugins: [],
}
