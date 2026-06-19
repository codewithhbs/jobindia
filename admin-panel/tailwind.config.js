/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F6EF7', dark: '#3A57E8', light: '#F0F3FF', mid: '#C7D0FC' },
        secondary: '#0EA5A0',
        accent: '#F59E0B',
        danger: '#F43F5E',
        success: '#22C55E',
        ink: '#13111A',
        muted: '#6B6B85',
        surface: '#FFFFFF',
        bg: '#F5F5FA',
        line: '#E6E6EF',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 4px rgba(19,17,26,0.06)', soft: '0 2px 8px rgba(19,17,26,0.07)' },
    },
  },
  plugins: [],
};
