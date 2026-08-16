import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edfff7",
          100: "#d5fbed",
          200: "#aaf4d4",
          300: "#74e7b8",
          400: "#3dd39a",
          500: "#22c58b",
          600: "#13a875",
          700: "#0c865f",
          800: "#0b684d",
          900: "#0a4c3a",
          950: "#052b21",
        },
        navy: {
          50: "#edfff7",
          100: "#d5fbed",
          200: "#aaf4d4",
          300: "#74e7b8",
          400: "#3dd39a",
          500: "#22c58b",
          600: "#13a875",
          700: "#0c865f",
          800: "#0b684d",
          900: "#0a4c3a",
          950: "#052b21",
        },
        emerald: {
          50: "#edfff7",
          100: "#d5fbed",
          200: "#aaf4d4",
          300: "#74e7b8",
          400: "#3dd39a",
          500: "#22c58b",
          600: "#13a875",
          700: "#0c865f",
          800: "#0b684d",
          900: "#0a4c3a",
          950: "#052b21",
        },
        mint: {
          200: "#c8ffe6",
          300: "#9ff3cf",
          400: "#6fe5b3",
          500: "#3dd39a",
        },
        gold: {
          300: "#f8dfa2",
          400: "#e8bb62",
          500: "#c9913b",
          600: "#a9762d",
        },
        surface: {
          50: "#f2fff9",
          100: "#dff8eb",
          200: "#b9e8d2",
          800: "#102c24",
          900: "#0b211b",
          950: "#04110e",
        },
        ruby: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          900: "#4c0519",
        },
        sapphire: {
          400: "#7dd3c0",
          500: "#3dbb9b",
          600: "#249477",
          900: "#0b4c3b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(61, 211, 154, 0.32)",
        gold: "0 0 24px rgba(232, 187, 98, 0.4)",
        ruby: "0 0 24px rgba(244, 63, 94, 0.4)",
        sapphire: "0 0 24px rgba(61, 187, 155, 0.32)",
        card: "0 14px 44px -16px rgba(0, 0, 0, 0.42)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        "jackpot-tick": "jackpot 0.3s ease-out",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin 6s linear infinite",
        rise: "rise 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        jackpot: {
          "0%": { transform: "scale(1.1)", color: "#e8bb62" },
          "100%": { transform: "scale(1)", color: "inherit" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        rise: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
