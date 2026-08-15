"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";

export function GameBackBar({ href = "/games" }: { href?: string }) {
  const t = useLang((s) => s.t);
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[90] pt-safe">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start px-2 py-2">
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md active:scale-95"
          aria-label={t("Back", "পেছনে")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("Back", "পেছনে")}</span>
        </Link>
      </div>
    </div>
  );
}
