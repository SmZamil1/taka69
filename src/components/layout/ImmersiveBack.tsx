"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Floating back chip for immersive full-screen games */
export function ImmersiveBack({
  href = "/games",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Back"
      className={cn(
        "fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full",
        "border border-white/15 bg-black/55 text-white shadow-lg shadow-black/40 backdrop-blur-md",
        "active:scale-95 hover:bg-black/70",
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </Link>
  );
}
