/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'edelyx-bg': '#040B15',
        'edelyx-dark': '#07101F',
        'edelyx-card': '#0A1526',
        'edelyx-surface': '#102038',
        'edelyx-border': '#454545',
        'edelyx-wine': '#640000',
        'edelyx-wine-dark': '#400001',
        'edelyx-rose': '#B67E7D',
        'edelyx-accent': '#FF1756',
        'edelyx-accent-hover': '#E0114B',
        'edelyx-gold': '#F59E0B',
        'edelyx-muted': '#C8BDBD',
      },
      fontFamily: {
        teko: ['Teko', 'sans-serif'],
        eczar: ['Eczar', 'serif'],
      },
    },
  },
  plugins: [],
};
