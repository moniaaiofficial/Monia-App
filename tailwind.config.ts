import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: '#c6ff33',
        'neon-dim': 'rgba(198,255,51,0.1)',
        'app-bg': '#06000c',
        'surface': 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-sm': '0 0 10px rgba(198,255,51,0.35)',
        'neon':    '0 0 20px rgba(198,255,51,0.5)',
        'neon-lg': '0 0 40px rgba(198,255,51,0.65)',
        'glow-sm': '0 0 15px rgba(198,255,51,0.35)',
        glow:      '0 0 25px rgba(198,255,51,0.5)',
        'glow-lg': '0 0 40px rgba(198,255,51,0.65)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon':   'linear-gradient(135deg, #c6ff33 0%, #a8e000 100%)',
      },
      keyframes: {
        breathePulse: {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(198,255,51,0.25), inset 0 0 0 1px rgba(198,255,51,0.1)' },
          '50%':     { boxShadow: '0 0 0 1.5px rgba(198,255,51,0.9), inset 0 0 0 1px rgba(198,255,51,0.2), 0 0 14px rgba(198,255,51,0.25)' },
        },
        liquidMetal: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        skeletonWave: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        notifPulse: {
          '0%,100%': { color: '#ffffff' },
          '20%':     { color: '#00e5ff' },
          '50%':     { color: '#ff00ff' },
          '75%':     { color: '#a855f7' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'breathe': 'breathePulse 3s ease-in-out infinite',
        'liquid':  'liquidMetal 2.4s linear infinite',
        'skeleton':'skeletonWave 1.6s ease-in-out infinite',
        'notif':   'notifPulse 4s ease-in-out infinite',
        'enter':   'fadeInUp 0.35s ease both',
        'scale-in':'scaleIn 0.25s ease both',
      },
    },
  },
  plugins: [],
};
export default config;
