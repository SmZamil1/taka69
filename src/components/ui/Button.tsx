"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3.5 text-base",
        variant === "primary" &&
          "bg-emerald-500 hover:bg-emerald-400 text-white shadow-glow",
        variant === "gold" &&
          "bg-gradient-to-r from-amber-400 to-yellow-500 text-emerald-950 shadow-gold",
        variant === "ghost" &&
          "bg-white/5 hover:bg-white/10 text-white border border-white/10",
        variant === "soft" && "bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100",
        variant === "danger" && "bg-rose-600 hover:bg-rose-500 text-white",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
