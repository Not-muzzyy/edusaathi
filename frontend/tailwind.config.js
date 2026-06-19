/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#040408",
        violetAccent: "#6C63FF",
        tealAccent: "#4ECDC4",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        header: ["Plus Jakarta Sans", "sans-serif"],
      }
    },
  },
  plugins: [],
}
