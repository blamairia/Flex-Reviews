const { skeleton } = require('@skeletonlabs/tw-plugin');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0",
          300: "#6ee7b7", 400: "#34d399", 500: "#10b981",
          600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
        }
      },
      borderRadius: { 
        xl: "1rem", 
        "2xl": "1.25rem" 
      },
      boxShadow: {
        card: "0 10px 25px -10px rgba(0,0,0,0.15)",
        soft: "0 4px 12px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [
    skeleton(),
    require("@tailwindcss/forms"), 
    require("@tailwindcss/typography")
  ]
};
