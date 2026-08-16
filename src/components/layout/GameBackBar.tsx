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
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#102b57]/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:bg-[#173b73] active:scale-95"
          aria-label={t("Back", "পেছনে")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("Back", "পেছনে")}</span>
        </Link>
        {showBalance && user && (
          <div className="rounded-xl border border-white/20 bg-white/95 px-3 py-1.5 text-xs font-black tabular-nums text-[#173251] shadow-lg backdrop-blur-md">
            <span className="mr-0.5 text-[#2f80c5]">৳</span>{formatCoins(user.balance)}
          </div>
        )}
      </div>
    </div>
  );
}
