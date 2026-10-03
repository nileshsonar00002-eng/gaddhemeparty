/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './admin.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        heading: 'var(--heading)',
        primary: 'var(--primary)',
        'primary-ink': 'var(--primary-ink)',
        band: 'var(--band)',
        'band-ink': 'var(--band-ink)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      fontFamily: {
        heading: ['"Average Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Average Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      borderRadius: {
        'btn': '12px',
        'card': '16px',
        'chip': '8px'
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(41, 96, 74, 0.08), 0 8px 24px rgba(41, 96, 74, 0.06)',
        'card': 'var(--shadow-card)',
        'dropdown': '0 4px 12px 0 rgba(41, 96, 74, 0.15)'
      }
    },
  },
  plugins: [],
}
