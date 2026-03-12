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
        brand: '#ff1e43',
        'brand-hover': '#e01038',
        'app-bg': '#100002',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(255, 30, 67, 0.4)',
        glow: '0 0 25px rgba(255, 30, 67, 0.55)',
        'glow-lg': '0 0 40px rgba(255, 30, 67, 0.7)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #ff1e43 0%, #cc0a2f 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
