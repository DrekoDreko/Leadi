import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/landing/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
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
