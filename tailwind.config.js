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
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        brand: {
          navy: '#0B0F14',
          slate: '#12171E',
          card: '#182028',
          cardLight: '#FFFFFF',
          border: '#232B36',
          borderLight: '#E3E3DC',
          amber: '#F5B301',
          amberHover: '#D97706',
          rose: '#E5484D',
          roseHover: '#C5282E',
          emerald: '#30A46C',
          chai: '#F5B301'
        }
      },
      fontFamily: {
        heading: ['"Baloo 2"', '"Noto Sans Devanagari"', 'cursive', 'sans-serif'],
        sans: ['"Inter"', '"Noto Sans Devanagari"', '"Poppins"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      borderRadius: {
        'btn': '12px',
        'card': '16px',
        'chip': '8px'
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 4px 12px 0 rgba(0, 0, 0, 0.15)'
      }
    },
  },
  plugins: [],
}
