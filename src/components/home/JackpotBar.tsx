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
    <div className="relative overflow-hidden rounded-2xl border border-[#e8bd55]/45 bg-gradient-to-b from-[#102b57] via-[#183d73] to-[#0c2143] px-3 py-3.5 shadow-[0_12px_30px_rgba(16,43,87,0.28)]">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(232,189,85,0.24),transparent_42%),radial-gradient(circle_at_85%_50%,rgba(139,188,232,0.2),transparent_40%)]" />
      <div className="pointer-events-none absolute -left-6 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#e8bd55]/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-4 top-0 h-16 w-16 rounded-full bg-[#8bbce8]/15 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="relative hidden h-14 w-14 shrink-0 sm:block">
          <Image src="/icons/cat-hot.png" alt="" fill className="object-contain drop-shadow-lg" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#ffe3a3]/75" />
            <div className="bg-gradient-to-b from-white via-[#dceeff] to-[#e8bd55] bg-clip-text text-[22px] font-black tracking-[0.14em] text-transparent drop-shadow">
              JACKPOT
            </div>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#ffe3a3]/75" />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1 sm:justify-start">
            {groups.map((g, gi) => (
              <div key={gi} className="flex items-center gap-0.5">
                {gi > 0 && (
                  <span className="mx-0.5 text-base font-black text-[#ffe3a3]/85">,</span>
                )}
                {g.split("").map((d, di) => (
                  <span
                    key={`${gi}-${di}`}
                    className={cn(
                      "inline-flex h-8 min-w-[1.55rem] items-center justify-center rounded-md",
                      "border border-[#8bbce8]/35 bg-gradient-to-b from-[#173a6c] to-[#0c2143]",
                      "px-0.5 text-[15px] font-black tabular-nums text-[#f8fbfe] shadow-inner"
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
            ))}
            <span className="ml-1.5 text-[10px] font-bold tracking-wider text-blue-100/70">BDT</span>
          </div>

          <div className="mt-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-100/65 sm:text-left">
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
