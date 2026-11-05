/** Thème Tailwind Freda (compilé via `npm run build:css`). */
module.exports = {
  content: ["./*.html", "./espace/*.html", "./ht/*.html", "./en/*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        midnight: '#061137',
        navy: '#071653',
        marine: '#1E3A8A',
        deep: '#173A9E',
        freda: '#2B64E4',
        royal: '#2563EB',
        sky: '#4A95F5',
        mist: '#EEF3FD',
        gold: '#F5B83D',
        canvas: '#F8FAFC',
        ink: '#0B1533',
        muted: '#5B6478',
        line: '#E3E8F2',
        cta: { DEFAULT: '#10B981', dark: '#059669' },
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: { site: '1200px' },
    },
  },
};
