"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] shadow-sm outline-none transition placeholder:text-[var(--muted)]",
          "focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
          "disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]",
          className
        )}
        {...props}
      />
    );
  }
);
