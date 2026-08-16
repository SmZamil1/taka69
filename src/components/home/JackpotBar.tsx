"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";

/** JETA7-style progressive jackpot board with digit tiles */
export function JackpotBar({ jackpot }: { jackpot?: number | null }) {
  const t = useLang((s) => s.t);
  const [displayed, setDisplayed] = useState(jackpot ?? 786_123_456);

  useEffect(() => {
    const base = jackpot && jackpot > 0 ? jackpot : 786_123_456;
    setDisplayed(base);
    const id = setInterval(() => {
      setDisplayed((v) => v + Math.floor(Math.random() * 17 + 3));
    }, 1200);
    return () => clearInterval(id);
  }, [jackpot]);

  const raw = Math.floor(displayed).toString();
  const padded = raw.padStart(Math.max(9, raw.length), "0");
  const groups: string[] = [];
  for (let i = padded.length; i > 0; i -= 3) {
    groups.unshift(padded.slice(Math.max(0, i - 3), i));
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-b from-[#0d4a2c] via-[#0a3a24] to-[#072a1a] px-3 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(251,191,36,0.28),transparent_42%),radial-gradient(circle_at_85%_50%,rgba(16,185,129,0.18),transparent_40%)]" />
      <div className="pointer-events-none absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-4 top-0 h-16 w-16 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="relative hidden h-14 w-14 shrink-0 sm:block">
          <Image src="/icons/cat-hot.png" alt="" fill className="object-contain drop-shadow-lg" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-amber-300/70" />
            <div className="text-[22px] font-black tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 drop-shadow">
              JACKPOT
            </div>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-amber-300/70" />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1 sm:justify-start">
            {groups.map((g, gi) => (
              <div key={gi} className="flex items-center gap-0.5">
                {gi > 0 && (
                  <span className="mx-0.5 text-base font-black text-amber-300/80">,</span>
                )}
                {g.split("").map((d, di) => (
                  <span
                    key={`${gi}-${di}`}
                    className={cn(
                      "inline-flex h-8 min-w-[1.55rem] items-center justify-center rounded-md",
                      "border border-emerald-500/30 bg-gradient-to-b from-[#0b1a12] to-black",
                      "px-0.5 text-[15px] font-black tabular-nums text-amber-100 shadow-inner"
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
            ))}
            <span className="ml-1.5 text-[10px] font-bold tracking-wider text-emerald-200/55">BDT</span>
          </div>

          <div className="mt-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200/45 sm:text-left">
            {t("Live progressive pool", "লাইভ প্রগ্রেসিভ পুল")} · ৳{formatCoins(displayed)}
          </div>
        </div>

        <div className="relative hidden h-12 w-12 shrink-0 sm:block">
          <Image src="/icons/cat-slots.png" alt="" fill className="object-contain opacity-90" />
        </div>
      </div>
    </div>
  );
}
