/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d3ff',
          300: '#9cbaff',
          400: '#6f96fa',
          500: '#4f6ef7',
          600: '#3d5ae8',
          700: '#2c44d4',
          800: '#2337ad',
          900: '#1a2d9c',
          950: '#0f1a5c',
        },
      },
    },
  },
  plugins: [],
};
