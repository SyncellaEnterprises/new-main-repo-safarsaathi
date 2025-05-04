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
        // Light & Airy travel-dating color palette
        primary: {
          DEFAULT: "#FF6F61", // Coral Red
          50: "#FFF0EE",
          100: "#FFE1DD",
          200: "#FFC3BB",
          300: "#FFA699",
          400: "#FF8A77",
          500: "#FF6F61",
          600: "#FF4F3D",
          700: "#FF2F18",
          800: "#F31A00",
          900: "#CE1700",
        },
        secondary: {
          DEFAULT: "#FFF3E9", // Peachy Beige
          50: "#FFFFFF",
          100: "#FFFFFF",
          200: "#FFFFFF",
          300: "#FFFAF6",
          400: "#FFF7F0",
          500: "#FFF3E9", 
          600: "#FFE3C8",
          700: "#FFD3A7",
          800: "#FFC385",
          900: "#FFB364",
        },
        accent: {
          DEFAULT: "#4DB6AC", // Sea Green
          50: "#E8F5F4",
          100: "#D1EBE8",
          200: "#A3D7D1",
          300: "#75C3BA",
          400: "#5EBDB4",
          500: "#4DB6AC",
          600: "#3E9991",
          700: "#307C75",
          800: "#236059",
          900: "#15433D",
        },
        romance: {
          DEFAULT: "#FF6F61", // Now matches Coral Red
          50: "#FFF0EE",
          100: "#FFE1DD",
          200: "#FFC3BB",
          300: "#FFA699",
          400: "#FF8A77",
          500: "#FF6F61",
          600: "#FF4F3D",
          700: "#FF2F18",
          800: "#F31A00",
          900: "#CE1700",
        },
        travel: {
          DEFAULT: "#4DB6AC", // Now matches Sea Green
          50: "#E8F5F4",
          100: "#D1EBE8",
          200: "#A3D7D1",
          300: "#75C3BA",
          400: "#5EBDB4",
          500: "#4DB6AC",
          600: "#3E9991",
          700: "#307C75",
          800: "#236059",
          900: "#15433D",
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#FFF3E9", // Now matches Peachy Beige
          medium: "#F5E1D3",
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
        'gradient-romance': 'linear-gradient(135deg, #FF6F61 0%, #FFA699 100%)',
        'gradient-travel': 'linear-gradient(135deg, #4DB6AC 0%, #75C3BA 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #4DB6AC 0%, #FF6F61 100%)',
        'gradient-peachy': 'linear-gradient(135deg, #FFF3E9 0%, #FFE3C8 100%)',
        'gradient-shine': 'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
        'pattern-waves': "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10C35 5 40 10 45 10S55 5 60 10s10 0 15 0' stroke='%23FF6F61' stroke-opacity='0.05' stroke-width='2' fill='none' /%3E%3C/svg%3E\")",
        'pattern-dots': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234DB6AC' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")",
        'pattern-travel': "url(\"data:image/svg+xml,%3Csvg width='32' height='26' viewBox='0 0 32 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 8.5C14 11.5376 11.5376 14 8.5 14C5.46243 14 3 11.5376 3 8.5C3 5.46243 5.46243 3 8.5 3C11.5376 3 14 5.46243 14 8.5Z' stroke='%23FF6F61' stroke-opacity='0.08' stroke-width='1.5'/%3E%3Cpath d='M29 17.5C29 20.5376 26.5376 23 23.5 23C20.4624 23 18 20.5376 18 17.5C18 14.4624 20.4624 12 23.5 12C26.5376 12 29 14.4624 29 17.5Z' stroke='%234DB6AC' stroke-opacity='0.1' stroke-width='1.5'/%3E%3C/svg%3E\")"
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.05)',
        'button': '0 4px 8px rgba(255, 111, 97, 0.15)',
        'hover': '0 8px 20px rgba(0, 0, 0, 0.08)',
        'inner-light': 'inset 0 2px 4px rgba(255, 255, 255, 0.1)',
        'inner-dark': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
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
