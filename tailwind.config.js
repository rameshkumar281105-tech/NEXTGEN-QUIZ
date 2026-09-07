/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0B14',
          surface: '#12141F',
          elevated: '#191C2B',
          border: '#242739',
        },
        accent: {
          violet: '#7C6AEF',
          violetDim: '#5B4DC4',
          amber: '#F5B942',
          cyan: '#4DD8E8',
        },
        success: '#34D399',
        danger: '#F0596A',
        text: {
          primary: '#F1F0F7',
          muted: '#9291AB',
          faint: '#5D5C74',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.08)' },
          '66%': { transform: 'translate(-25px, 25px) scale(0.95)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        blob: 'blob 14s infinite ease-in-out',
        floaty: 'floaty 4s ease-in-out infinite',
        popIn: 'popIn 0.35s ease-out',
        shimmer: 'shimmer 2.2s infinite linear',
      },
    },
  },
  plugins: [],
}
