/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",       // For App Router
    "./src/pages/**/*.{js,ts,jsx,tsx}",     // Optional: if still using Pages Router
    "./src/components/**/*.{js,ts,jsx,tsx}" // For shared components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}