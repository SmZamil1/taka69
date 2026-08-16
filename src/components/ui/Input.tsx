"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-11 w-full rounded-2xl border border-[#cfe0ee] bg-white px-4 py-3 text-[#173251] shadow-sm outline-none transition placeholder:text-[#8ba0b3]",
          "focus:border-[#2f80c5] focus:ring-2 focus:ring-[#2f80c5]/20",
          "disabled:cursor-not-allowed disabled:bg-[#f3f7fa] disabled:text-[#8ba0b3]",
          className
        )}
        {...props}
      />
    );
  }
);
