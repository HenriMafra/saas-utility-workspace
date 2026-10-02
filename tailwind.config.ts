import type { Config } from "tailwindcss";
import tokens from "./tokens.json";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: tokens.color.brand,
        neutral: tokens.color.neutral,
        success: tokens.color.success,
        warning: tokens.color.warning,
        danger: tokens.color.danger,
        info: tokens.color.info,
        // semantic (driven by CSS vars in globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
      },
      borderRadius: tokens.radius,
      boxShadow: tokens.shadow,
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      maxWidth: { content: "1200px" },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out",
        "slide-up": "slide-up .25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
