import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,ts}"],
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
