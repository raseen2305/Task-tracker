/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          50:  '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337',
        },
        gold: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        surface: {
          950: '#0a0608', 900: '#0f0a0c', 800: '#160d10', 700: '#1e1115',
          600: '#261519', 500: '#3d1f25', 400: '#5a2d35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        // Entrance
        'fade-in':        'fadeIn 0.4s ease both',
        'fade-up':        'fadeUp 0.45s ease both',
        'fade-down':      'fadeDown 0.35s ease both',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-in-left':  'slideInLeft 0.35s ease both',
        // Continuous
        'pulse-slow':     'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-rose':      'glowRose 2.5s ease-in-out infinite alternate',
        'glow-gold':      'glowGold 2.5s ease-in-out infinite alternate',
        'float':          'float 4s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'spin-slow':      'spin 3s linear infinite',
        'bounce-subtle':  'bounceSubtle 2s ease-in-out infinite',
        'ticker':         'ticker 0.1s ease both',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' },                          '100%': { opacity: '1' } },
        fadeUp:       { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeDown:     { '0%': { opacity: '0', transform: 'translateY(-12px)' },'100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:      { '0%': { opacity: '0', transform: 'scale(0.88)' },'100%': { opacity: '1', transform: 'scale(1)' } },
        slideInLeft:  { '0%': { opacity: '0', transform: 'translateX(-20px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        glowRose:     { '0%': { boxShadow: '0 0 6px #e11d4830' }, '100%': { boxShadow: '0 0 20px #e11d4870, 0 0 40px #e11d4820' } },
        glowGold:     { '0%': { boxShadow: '0 0 6px #f59e0b30' }, '100%': { boxShadow: '0 0 20px #f59e0b60, 0 0 40px #f59e0b20' } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceSubtle: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-3px)' } },
        ticker:       { '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.9)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
