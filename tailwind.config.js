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
        ink: 'var(--ink)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      fontFamily: {
        heading: ['"Inter"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Inter"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      borderRadius: {
        'btn': '12px',
        'card': '16px',
        'chip': '8px'
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card': 'var(--shadow-card)',
        'dropdown': '0 4px 12px 0 rgba(0, 0, 0, 0.15)'
      }
    },
  },
  plugins: [],
}
