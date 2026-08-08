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
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        surface: {
          800: "#132a1e",
          900: "#0b1a12",
          950: "#04120c",
        },
        ruby: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          900: "#4c0519",
        },
        sapphire: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          900: "#082f49",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 197, 94, 0.4)",
        gold: "0 0 24px rgba(251, 191, 36, 0.4)",
        ruby: "0 0 24px rgba(244, 63, 94, 0.4)",
        sapphire: "0 0 24px rgba(14, 165, 233, 0.4)",
        card: "0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        "jackpot-tick": "jackpot 0.3s ease-out",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin 6s linear infinite",
        "rise": "rise 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        jackpot: {
          "0%": { transform: "scale(1.1)", color: "#fbbf24" },
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
