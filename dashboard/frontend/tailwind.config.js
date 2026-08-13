/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      colors: {
        base: {
          950: '#0b0c10',
          900: '#101218',
          850: '#161923',
          800: '#1c202c',
          700: '#272c3b'
        },
        signal: {
          400: '#8b7cff',
          500: '#6f5cff',
          600: '#5a45f2'
        },
        ember: {
          400: '#ff9d5c',
          500: '#ff8438'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(139,124,255,0.15), 0 8px 30px rgba(111,92,255,0.15)'
      }
    }
  },
  plugins: []
};
