import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(n: number, digits = 0) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-BD", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatTK(n: number, digits = 0) {
  return `${formatCoins(n, digits)} TK`;
}

export function currencyLabel() {
  return "TK";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
