const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Work Sans", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  daisyui: {
    themes: ["light", "dark"],
  },

  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
