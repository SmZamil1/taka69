"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

export function JackpotBar({ initial = 1000000 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  const t = useLang((s) => s.t);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => v + Math.floor(Math.random() * 17) + 3);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const digits = formatCoins(value, 0).replace(/,/g, "").padStart(9, "0");
  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-3 shadow-gold">
      <div className="absolute -left-2 top-1 text-4xl opacity-80">👸</div>
      <div className="absolute -right-1 bottom-0 text-3xl opacity-70">🐯</div>
      <div className="text-center">
        <div className="text-xs font-black tracking-[0.3em] text-gold-400">
          ★ {t("JACKPOT", "জ্যাকপট")} ★
        </div>
        <div className="mt-2 flex justify-center gap-1.5 font-mono text-2xl font-black text-white">
          {groups.map((g, i) => (
            <span key={i} className="flex gap-0.5">
              {g.split("").map((d, j) => (
                <span
                  key={j}
                  className="inline-flex h-9 w-7 items-center justify-center rounded-md bg-black/50 border border-gold-500/20 shadow-inner"
                >
                  {d}
                </span>
              ))}
              {i < 2 && <span className="px-0.5 text-gold-400">,</span>}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-emerald-200/60">
          {t("Virtual display · play money", "ভার্চুয়াল ডিসপ্লে · প্লে-মানি")}
        </p>
      </div>
    </div>
  );
}
