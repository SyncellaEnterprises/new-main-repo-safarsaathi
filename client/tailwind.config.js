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
        // Modern travel-dating color palette
        primary: {
          DEFAULT: "#FF6B6B", // Warm coral
          50: "#FFF0F0",
          100: "#FFE1E1",
          200: "#FFC4C4",
          300: "#FFA7A7",
          400: "#FF8989",
          500: "#FF6B6B",
          600: "#FF4D4D",
          700: "#FF2F2F",
          800: "#FF1111",
          900: "#F30000",
        },
        secondary: {
          DEFAULT: "#4ECDC4", // Ocean teal
          50: "#EFFAF9",
          100: "#DFF5F3",
          200: "#BFEBE7",
          300: "#9FE1DB",
          400: "#7FD7CF",
          500: "#4ECDC4",
          600: "#3DBEB5",
          700: "#2C9F96",
          800: "#1B8077",
          900: "#0A6158",
        },
        accent: {
          DEFAULT: "#FFB84C", // Sunset gold
          50: "#FFF8E6",
          100: "#FFF1CC",
          200: "#FFE299",
          300: "#FFD466",
          400: "#FFC533",
          500: "#FFB84C",
          600: "#FFA819",
          700: "#E68A00",
          800: "#B36B00",
          900: "#804C00",
        },
        romance: {
          DEFAULT: "#FF8FB1", // Soft pink
          50: "#FFF0F5",
          100: "#FFE1EB",
          200: "#FFC3D7",
          300: "#FFA5C3",
          400: "#FF87AF",
          500: "#FF8FB1",
          600: "#FF619B",
          700: "#FF3385",
          800: "#FF056F",
          900: "#D60058",
        },
        travel: {
          DEFAULT: "#45B7D1", // Sky blue
          50: "#EFF9FC",
          100: "#DFF3F9",
          200: "#BFE7F3",
          300: "#9FDBEC",
          400: "#7FCFE6",
          500: "#45B7D1",
          600: "#35A8C2",
          700: "#2589A3",
          800: "#156A84",
          900: "#054B65",
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#F8FAFC",
          medium: "#E2E8F0",
          dark: "#334155",
          darkest: "#0F172A",
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
        'gradient-romance': 'linear-gradient(135deg, #FF8FB1 0%, #FF6B6B 100%)',
        'gradient-travel': 'linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FFB84C 0%, #FF8FB1 100%)',
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
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}
