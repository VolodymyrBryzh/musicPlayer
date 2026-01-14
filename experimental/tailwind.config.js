/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg, #050505)',
        primary: 'var(--primary, #ffffff)',
        text: 'var(--text, #e0e0e0)',
        subtext: 'var(--subtext, #555)',
      },
      backdropBlur: {
        'glass': '15px',
      }
    },
  },
  plugins: [],
}
