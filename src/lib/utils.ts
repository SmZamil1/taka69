import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Full BDT balance — never shortens to K/M */
export function formatCoins(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** With ৳ prefix */
export function formatBdt(amount: number | null | undefined): string {
  return `৳${formatCoins(amount)}`;
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export function shortAddress(addr: string, chars = 4) {
  if (!addr) return "";
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
