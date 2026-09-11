/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1410',
        walnut: '#2a1f18',
        felt: '#1f4a38',
        'felt-deep': '#163528',
        cream: '#f4ead6',
        parchment: '#e7d7b8',
        gold: '#c4a35a',
        rust: '#a3543a',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        table: '0 18px 50px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
