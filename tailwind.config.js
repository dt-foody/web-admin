// tailwind.config.js
import typography from '@tailwindcss/typography'

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    typography,
  ],
}
