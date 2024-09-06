/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        whiteDefault: "#F8F9FA",
        defaultBlue: "#2F72E3",
        defaultBlueDark: "#0E4AAF",
      },
    },
  },
  plugins: [],
}
