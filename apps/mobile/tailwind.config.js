/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a0a0a',
          foreground: '#fafafa',
        },
        secondary: {
          DEFAULT: '#f4f4f5',
          foreground: '#0a0a0a',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#f4f4f5',
          foreground: '#71717a',
        },
        accent: {
          DEFAULT: '#f4f4f5',
          foreground: '#0a0a0a',
        },
        risk: {
          low: '#22c55e',
          medium: '#eab308',
          high: '#f97316',
          blocked: '#ef4444',
        },
        cta: {
          0: '#22c55e',
          1: '#3b82f6',
          2: '#eab308',
          3: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
