"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";

/**
 * Immersive game chrome: back only + optional corner balance
 * (for non-Aviator/Maya/Plinko games that need wallet visibility).
 */
export function GameBackBar({
  href = "/games",
  showBalance = false,
}: {
  href?: string;
  showBalance?: boolean;
}) {
  const t = useLang((s) => s.t);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[90] pt-safe">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-2 px-2 py-2">
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md active:scale-95"
          aria-label={t("Back", "পেছনে")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("Back", "পেছনে")}</span>
        </Link>
        {showBalance && user && (
          <div className="rounded-full border border-amber-400/30 bg-black/65 px-3 py-1.5 text-xs font-black tabular-nums text-amber-300 shadow-lg backdrop-blur-md">
            ৳{formatCoins(user.balance)}
          </div>
        )}
      </div>
    </div>
  );
}
