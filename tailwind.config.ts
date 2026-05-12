import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        xl: "0.85rem",
      },
      colors: {
        surface: {
          DEFAULT: "rgb(248 250 252)",
          foreground: "rgb(15 23 42)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
