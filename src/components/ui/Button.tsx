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
        "inline-flex min-h-10 items-center justify-center rounded-2xl font-semibold tracking-tight transition duration-150",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80c5]/60",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3.5 text-base",
        variant === "primary" &&
          "bg-gradient-to-b from-[#2f80c5] to-[#1f609e] text-white shadow-[0_8px_24px_rgba(47,128,197,0.28)] hover:brightness-105",
        variant === "gold" &&
          "bg-gradient-to-b from-[#f8d98e] to-[#f2b84b] text-[#102b57] shadow-[0_8px_24px_rgba(242,184,75,0.3)] hover:brightness-105",
        variant === "ghost" &&
          "border border-[#dce8f2] bg-white text-[#173f73] shadow-sm hover:bg-[#f8fbfe]",
        variant === "soft" &&
          "border border-[#cfe3f3] bg-[#e8f2fb] text-[#173f73] hover:bg-[#dceeff]",
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
