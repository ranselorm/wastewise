/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: { colors: {
    canvas: '#F7F7F2', ink: '#173A2D', forest: '#244A3C', 'forest-soft': '#416053',
    'forest-muted': '#627A6D', sage: '#E3EADF', peach: '#F4A261', copy: '#5D6C63',
    lime: '#B7D9A8', card: '#E1EDDA', 'card-label': '#4D775F', 'card-ink': '#244A3C',
    'card-copy': '#547063', 'card-track': '#C3D9BC', 'card-progress': '#5D9970', footer: '#84938A',
  } } },
  plugins: [],
};
