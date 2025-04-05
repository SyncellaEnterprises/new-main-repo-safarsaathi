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
        primary: {
          DEFAULT: "#7D5BA6", // Soft purple - elegant and romantic
          light: "#9D7EBD", // Light purple
          dark: "#5A4180", // Deep purple
        },
        secondary: {
          DEFAULT: "#50A6A7", // Soft teal - travel/adventure feel
          light: "#7FC2C3", // Light teal
          dark: "#398788", // Deep teal
        },
        accent: {
          DEFAULT: "#D6A655", // Warm gold - subtle warmth
          light: "#E6C489", // Light gold
          dark: "#B38B40", // Deep gold
        },
        neutral: {
          lightest: "#FFFFFF",
          light: "#F8F7FA",
          medium: "#E6E4EC",
          dark: "#34323E",
          darkest: "#1D1B26",
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
      }
    },
  },
  plugins: [],
}
