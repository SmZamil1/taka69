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
        "inline-flex items-center justify-center rounded-2xl font-semibold tracking-tight transition duration-150",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/60",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3.5 text-base",
        variant === "primary" &&
          "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] hover:brightness-110",
        variant === "gold" &&
          "bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow-[0_8px_24px_rgba(251,191,36,0.35)] hover:brightness-105",
        variant === "ghost" &&
          "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur",
        variant === "soft" &&
          "bg-white/8 hover:bg-white/12 text-emerald-50 border border-white/8 backdrop-blur",
        variant === "danger" &&
          "bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_8px_24px_rgba(244,63,94,0.3)]",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
