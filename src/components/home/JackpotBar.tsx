"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";

export function JackpotBar({ jackpot }: { jackpot?: number | null }) {
  const t = useLang((s) => s.t);
  const [displayed, setDisplayed] = useState(jackpot ?? 1000000);

  // Animate jackpot ticking up
  useEffect(() => {
    const base = jackpot ?? 1000000;
    setDisplayed(base);
    const id = setInterval(() => {
      setDisplayed(v => v + Math.floor(Math.random() * 3 + 1));
    }, 1800);
    return () => clearInterval(id);
  }, [jackpot]);

  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-900/30 to-orange-900/30 py-3 px-4">
      <span className="text-xl">🏆</span>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/60">{t("Jackpot Pool","জ্যাকপট পুল")}</div>
        <div className="text-xl font-black text-amber-300 tabular-nums">{formatCoins(displayed)} TK</div>
      </div>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}
