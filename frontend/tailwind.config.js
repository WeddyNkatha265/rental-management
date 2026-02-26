/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#E8D9A0',
          400: '#D4AF37',
          500: '#C5A028',
          600: '#B8922A',
          700: '#8B6914',
        },
        estate: {
          50:  '#F5F0E8',
          100: '#E8E0D0',
          700: '#1E1E2A',
          800: '#1A1A24',
          850: '#161620',
          900: '#111118',
          950: '#0A0A0F',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
