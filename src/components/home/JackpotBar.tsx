"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";

export function JackpotBar({ jackpot }: { jackpot?: number | null }) {
  const t = useLang((s) => s.t);
  const [displayed, setDisplayed] = useState(jackpot ?? 645778628);

  useEffect(() => {
    const base = jackpot && jackpot > 0 ? jackpot : 645778628;
    setDisplayed(base);
    const id = setInterval(() => {
      setDisplayed((v) => v + Math.floor(Math.random() * 17 + 3));
    }, 1400);
    return () => clearInterval(id);
  }, [jackpot]);

  // Full number digits — no K/M
  const raw = Math.floor(displayed).toString();
  const padded = raw.padStart(Math.max(9, raw.length), "0");
  // group by 3 from right
  const groups: string[] = [];
  for (let i = padded.length; i > 0; i -= 3) {
    groups.unshift(padded.slice(Math.max(0, i - 3), i));
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#0b3d24] via-[#0f4a2c] to-[#0b3d24] px-3 py-3 shadow-lg">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,0.35),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(52,211,153,0.2),transparent_40%)]" />
      <div className="relative flex items-center gap-3">
        <div className="hidden sm:block text-4xl">🏺</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div className="text-xl font-black tracking-wide bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent drop-shadow">
              JACKPOT
            </div>
            <span className="text-lg">⭐</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {groups.map((g, gi) => (
              <div key={gi} className="flex items-center gap-0.5">
                {gi > 0 && <span className="mx-0.5 text-amber-300/70 font-black">,</span>}
                {g.split("").map((d, di) => (
                  <span
                    key={`${gi}-${di}`}
                    className="inline-flex h-7 min-w-[1.4rem] items-center justify-center rounded-md border border-emerald-700/60 bg-black/50 px-0.5 text-sm font-black text-amber-200 tabular-nums shadow-inner"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ))}
            <span className="ml-1 text-[10px] font-bold text-emerald-200/50">BDT</span>
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-emerald-200/40">
            {t("Live progressive pool", "লাইভ প্রগ্রেসিভ পুল")} · ৳{formatCoins(displayed)}
          </div>
        </div>
        <div className="text-3xl animate-pulse">🪙</div>
      </div>
    </div>
  );
}
