import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', ...defaultTheme.fontFamily.sans],
        serif: ['"Playfair Display"', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
      // Enhanced typography scale with proper line heights and letter spacing
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.015em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.005em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      colors: {
          // Himalayan Spices - Warm Earthy Color Palette
          primary: {
            50: '#fdf8f6',   // Warm cream backgrounds
            100: '#f9ede8',  // Light warm backgrounds
            200: '#f0d9cf',  // Subtle warm borders
            300: '#e5c1b1',  // Warm disabled states
            400: '#c9956f',  // Warm placeholders
            500: '#8B4513',  // Saddlebrown - earthy spice color
            600: '#723A0F',  // Darker spice
            700: '#5C2E0C',  // Deep earthy brown
            800: '#4A2409',  // Ultra dark brown
            900: '#2D1606',  // Maximum contrast
            DEFAULT: '#8B4513',
            dark: '#5C2E0C',
            light: '#c9956f',
          },
          secondary: {
            50: '#fffbf5',   // Warm white
            100: '#fef7ed',  // Cream background
            200: '#fcebd5',  // Turmeric light
            300: '#f9d9b0',  // Golden light
            400: '#d4a574',  // Warm tan
            500: '#a67c52',  // Cinnamon brown
            600: '#8b6642',  // Warm medium
            700: '#6d5035',  // Deep warm
            800: '#4a3825',  // Very dark warm
            900: '#2d2217',  // Maximum dark
            DEFAULT: '#a67c52',
            light: '#d4a574',
            dark: '#6d5035',
          },
          // Accent colors - saffron/turmeric inspired
          accent: {
            50: '#fffbeb',   // Light golden
            100: '#fef3c7',  // Pale saffron
            200: '#fde68a',  // Light saffron
            300: '#fcd34d',  // Golden yellow
            400: '#fbbf24',  // Bright gold
            500: '#D2691E',  // Chocolate/saffron - accent color
            600: '#b45309',  // Deep gold
            700: '#92400e',  // Deep amber
            DEFAULT: '#D2691E',
            dark: '#92400e',
            light: '#fcd34d',
          },
        // Essential UI state colors - used strategically
        state: {
          success: '#059669',     // Success, security
          error: '#dc2626',       // Error, urgency
          warning: '#d97706',     // Warning, attention
          info: '#0284c7',        // Information
        },
        // Sophisticated neutral palette - primary design foundation
        neutral: {
          50: '#fafaf9',    // Pure white backgrounds
          100: '#f5f5f4',   // Light backgrounds
          200: '#e7e5e4',   // Subtle borders
          300: '#d6d3d1',   // Light borders
          400: '#a8a29e',   // Placeholders, disabled
          500: '#78716c',   // Secondary text
          600: '#57534e',   // Primary text light
          700: '#44403c',   // Primary text
          800: '#292524',   // Dark text
          900: '#1c1917',   // Maximum contrast
          950: '#0c0a09',   // Ultra dark
        },
        // Background system
        background: {
          primary: '#fafaf9',     // Main background
          secondary: '#f5f5f4',   // Card backgrounds
          tertiary: '#ffffff',    // Pure white overlays
        },
        // Text system
        text: {
          primary: '#1c1917',     // Main text
          secondary: '#44403c',   // Secondary text
          tertiary: '#78716c',    // Muted text
          inverse: '#fafaf9',     // Light text on dark
        },
        // Sophisticated trust and conversion colors - luxury appropriate
        trust: {
          blue: '#0f172a',        // Deep sophisticated blue-black
          green: '#059669',       // Refined success green
        },
        conversion: {
          urgency: '#dc2626',     // Sophisticated red for urgency
          warning: '#d97706',     // Refined amber for warnings
        },
      },
      // Luxury spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Sophisticated shadow system
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'luxury-lg': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        'luxury-xl': '0 50px 100px -20px rgba(0, 0, 0, 0.35)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'focus': '0 0 0 3px rgba(71, 85, 105, 0.1)',
      },
      // Enhanced border radius for luxury feel
      borderRadius: {
        'luxury': '0.75rem',
        'luxury-lg': '1rem',
        'luxury-xl': '1.5rem',
      },
      // Animations removed for performance
    }
  },
  plugins: [],
};