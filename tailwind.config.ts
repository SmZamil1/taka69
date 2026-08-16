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
          50: "#eef5fb",
          100: "#e8f2fb",
          200: "#cfe3f3",
          300: "#a9cde8",
          400: "#76b1dc",
          500: "#2f80c5",
          600: "#2675bd",
          700: "#1f609e",
          800: "#173f73",
          900: "#102b57",
          950: "#0b2042",
        },
        navy: {
          50: "#eef5fb",
          100: "#e8f2fb",
          200: "#cfe3f3",
          300: "#a9cde8",
          400: "#76b1dc",
          500: "#2f80c5",
          600: "#2675bd",
          700: "#1f609e",
          800: "#173f73",
          900: "#102b57",
          950: "#0b2042",
        },
        gold: {
          300: "#f8d98e",
          400: "#f2b84b",
          500: "#d4871b",
          600: "#b86f12",
        },
        surface: {
          50: "#ffffff",
          100: "#f8fbfe",
          200: "#eef5fb",
          800: "#173f73",
          900: "#102b57",
          950: "#0b2042",
        },
        ruby: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          900: "#4c0519",
        },
        sapphire: {
          400: "#76b1dc",
          500: "#2f80c5",
          600: "#2675bd",
          900: "#173f73",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(47, 128, 197, 0.32)",
        gold: "0 0 24px rgba(242, 184, 75, 0.4)",
        ruby: "0 0 24px rgba(244, 63, 94, 0.4)",
        sapphire: "0 0 24px rgba(47, 128, 197, 0.32)",
        card: "0 10px 40px -12px rgba(16, 43, 87, 0.14)",
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
          "0%": { transform: "scale(1.1)", color: "#f2b84b" },
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
