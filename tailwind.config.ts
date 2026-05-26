import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/landing/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        "dashboard-card": "rgb(var(--dashboard-card) / <alpha-value>)",
        "dashboard-card-muted": "rgb(var(--dashboard-card-muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        cobalt: "rgb(var(--color-cobalt) / <alpha-value>)",
        signal: "rgb(var(--color-signal) / <alpha-value>)",
        lagoon: "rgb(var(--color-lagoon) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        cloud: "rgb(var(--color-cloud) / <alpha-value>)"
      },
      boxShadow: {
        glass: "var(--glass-shadow-custom)",
        soft: "var(--glass-soft-shadow)"
      }
    }
  },
  plugins: []
};

export default config;
