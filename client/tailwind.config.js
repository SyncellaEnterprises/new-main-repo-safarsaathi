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
          DEFAULT: "#FF4D6D", // Vibrant pink/red - romance/passion
          light: "#FF758F", // Light pink
          dark: "#D62E4D", // Deep red/pink
        },
        secondary: {
          DEFAULT: "#3D90E3", // Bright blue - travel/adventure
          light: "#70AEF0", // Light blue
          dark: "#1A6BBF", // Deep blue
        },
        accent: {
          DEFAULT: "#FFB626", // Warm vibrant gold - energy/excitement
          light: "#FFCB5C", // Light gold
          dark: "#E09600", // Deep gold
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
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-travel': 'linear-gradient(135deg, #3D90E3 0%, #1A6BBF 100%)',
        'gradient-romance': 'linear-gradient(135deg, #FF4D6D 0%, #D62E4D 100%)',
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.08)',
        'button': '0 4px 8px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
