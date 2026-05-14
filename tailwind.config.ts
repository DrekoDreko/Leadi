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
        ink: "#121721",
        cobalt: "#3462EE",
        signal: "#EFE347",
        lagoon: "#4A91A8",
        mist: "#EAF0DC",
        cloud: "#F6F8F2"
      },
      boxShadow: {
        glass: "0 24px 80px rgba(18, 23, 33, 0.14)",
        soft: "0 16px 48px rgba(18, 23, 33, 0.1)"
      }
    }
  },
  plugins: []
};

export default config;
