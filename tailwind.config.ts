import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pitch: {
          light: '#22c55e',
          dark: '#15803d',
          deep: '#14532d',
          boundary: '#ffffff'
        },
        card: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        bg: {
          light: '#f8fafc',
          dark: '#0f172a',
        }
      },
    },
  },
  plugins: [],
};
export default config;
