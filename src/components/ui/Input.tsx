"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-2xl bg-emerald-950/50 border border-emerald-700/40 px-4 py-3.5 text-white placeholder:text-emerald-200/40 outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/40",
          className
        )}
        {...props}
      />
    );
  }
);
