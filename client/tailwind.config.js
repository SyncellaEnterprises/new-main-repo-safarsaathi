/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.js",
    "./assets/**/*.js",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        montserratBold: ["Montserrat-Bold", "sans-serif"],
        montserratMedium: ["Montserrat-Medium", "sans-serif"],
        montserratLight: ["Montserrat-Light", "sans-serif"],
        youngSerif: ["YoungSerif-Regular", "serif"],
        spaceMono: ["SpaceMono-Regular", "monospace"],
      },
      colors: {
        // Modern color palette
        primary: {
          DEFAULT: "#7C3AED", // Vibrant purple
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        secondary: {
          DEFAULT: "#06B6D4", // Cyan
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        success: {
          DEFAULT: "#10B981", // Emerald
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        error: {
          DEFAULT: "#EF4444", // Red
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#F9FAFB",
          medium: "#E5E7EB",
          dark: "#1F2937",
          darkest: "#111827",
        }
      },
      spacing: {
        'screen-2': '2vh',
        'screen-4': '4vh',
        'screen-6': '6vh',
        'screen-8': '8vh',
      },
      padding: {
        'xs': '0.5rem',
        'sm': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'hover': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'inner-light': 'inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        'inner-dark': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shine': 'shine 1.5s infinite',
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}
