import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(
  readFileSync(resolve(__dirname, "../../shared/schemas/design-tokens.json"), "utf-8")
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        accent: tokens.colors.accent,
        surface: {
          light: tokens.colors.surface.light,
          blue: tokens.colors.surface.blue,
        },
        footer: tokens.colors.footer,
        heading: tokens.colors.text.heading,
        body: tokens.colors.text.body,
        muted: tokens.colors.text.muted,
      },
      fontFamily: {
        heading: [tokens.typography.fontFamilies.heading],
        body: [tokens.typography.fontFamilies.body],
      },
      borderRadius: {
        card: tokens.borderRadius.card,
        btn: tokens.borderRadius.button,
        logo: tokens.borderRadius.logo,
      },
      boxShadow: {
        card: tokens.shadows.card,
        "card-hover": tokens.shadows.cardHover,
        nav: tokens.shadows.nav,
      },
      maxWidth: {
        container: "1280px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { opacity: "0", maxHeight: "0" },
          "100%": { opacity: "1", maxHeight: "500px" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out forwards",
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideDown: "slideDown 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
