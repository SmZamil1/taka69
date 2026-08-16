"use client";

import { useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/** Display table — matches reduced server payouts */
const PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 2.4 },
  2: { 2: 6.5 },
  3: { 2: 1.2, 3: 18 },
  4: { 2: 1.05, 3: 2.4, 4: 45 },
  5: { 3: 1.4, 4: 5.5, 5: 120 },
  6: { 3: 1.1, 4: 2.4, 5: 16, 6: 280 },
  7: { 4: 1.6, 5: 7, 6: 28, 7: 700 },
  8: { 4: 1.2, 5: 3.5, 6: 14, 7: 90, 8: 1400 },
  9: { 5: 2.0, 6: 7, 7: 28, 8: 180, 9: 2800 },
  10: { 5: 1.4, 6: 3.5, 7: 14, 8: 90, 9: 700, 10: 5000 },
};

function getMultiplier(picked: number, matched: number): number {
  const row = PAYOUTS[picked];
  if (!row) return 0;
  // find best bracket
  const keys = Object.keys(row).map(Number).sort((a,b) => b-a);
  for (const k of keys) { if (matched >= k) return row[k]; }
  return 0;
}

export default function KenoPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<Set<number>>(new Set());
  const [amount, setBetAmt] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ matched: number; payout: number; mult: number } | null>(null);

  function toggleNum(n: number) {
    if (playing) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); } else if (next.size < 10) { next.add(n); }
      return next;
    });
  }

  async function play() {
    if (!user) { toast.error(t("Login required", "লগইন করুন")); return; }
    if (selected.size === 0) { toast.error(t("Pick at least 1 number", "কমপক্ষে ১টি নম্বর বেছে নিন")); return; }
    setPlaying(true);
    setDrawn(new Set());
    setResult(null);
    try {
      const res = await fetch("/api/games/keno", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ numbers: Array.from(selected), amount }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error || "Failed"); setPlaying(false); return; }

      // Animate balls one by one
      const drawnNums: number[] = json.data.drawn;
      for (let i = 0; i < drawnNums.length; i++) {
        await new Promise(r => setTimeout(r, 120));
        setDrawn((prev) => new Set(Array.from(prev).concat(drawnNums[i])));
      }

      const matched = drawnNums.filter((n) => selected.has(n)).length;
      const mult = Number(json.data.multiplier ?? getMultiplier(selected.size, matched));
      setResult({ matched, payout: json.data.payout, mult });
      if (typeof json.data.balance === "number") {
        useAuthStore.getState().setBalance(json.data.balance);
      }
      if (json.data.payout > 0) {
        toast.success(t("You won!", "জিতেছেন!"), `${matched} matched · +${json.data.payout} TK`);
      } else {
        toast.info(t(`${matched} matched`, `${matched}টি মিলেছে`));
      }
    } catch { toast.error("Network error"); }
    setPlaying(false);
  }

  const nums = Array.from({ length: 40 }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-black text-amber-300">{t("Keno", "কেনো")}</h1>
        <p className="text-xs text-white/40">{t(`Pick 1-10 numbers · ${selected.size} selected`, `১-১০টি নম্বর বেছে নিন · ${selected.size}টি বেছেছেন`)}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1 min-[360px]:grid-cols-6 min-[430px]:grid-cols-8 sm:gap-1.5">
        {nums.map(n => {
          const isPicked = selected.has(n);
          const isDrawn = drawn.has(n);
          const isHit = isPicked && isDrawn;
          const isMiss = isPicked && drawn.size > 0 && !isDrawn;
          return (
            <button key={n} onClick={() => toggleNum(n)}
              className={cn(
                "aspect-square rounded-lg text-xs font-black transition-all",
                isHit ? "bg-amber-400 text-emerald-950 scale-110 shadow-lg" :
                isMiss ? "bg-rose-500/30 text-rose-300" :
                isDrawn ? "bg-emerald-600/40 text-emerald-300 scale-105" :
                isPicked ? "bg-amber-400/20 border-2 border-amber-400 text-amber-300" :
                "bg-white/8 text-white/60 hover:bg-white/15"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Amount + Play */}
      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        {[50, 100, 500, 1000].map(a => (
          <button key={a} onClick={() => setBetAmt(a)}
            className={cn("flex-1 rounded-xl py-2 text-xs font-bold transition",
              amount === a ? "bg-amber-400 text-emerald-950" : "bg-white/8 text-white hover:bg-white/15"
            )}
          >{a}</button>
        ))}
      </div>

      <Button variant="gold" className="w-full font-black" disabled={playing || selected.size === 0} onClick={play}>
        {playing ? t("Drawing...", "ড্র হচ্ছে...") : `${t("Play", "খেলুন")} ${amount} TK · ${selected.size} ${t("numbers", "নম্বর")}`}
      </Button>

      {result && (
        <div className={cn("rounded-2xl border p-4 text-center", result.payout > 0 ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/5")}>
          <div className="text-2xl font-black text-white">{result.matched} {t("matched", "মিলেছে")}</div>
          {result.payout > 0 ? (
            <div className="text-xl font-black text-amber-300 mt-1">+{result.payout} TK ({result.mult}x)</div>
          ) : (
            <div className="text-sm text-white/50 mt-1">{t("Better luck next time", "পরের বার ভালো হবে")}</div>
          )}
        </div>
      )}

      {/* Payout table */}
      {selected.size > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
          <div className="text-[11px] text-white/40 uppercase tracking-wider mb-2">{t("Payouts", "পেআউট")}</div>
          {Object.entries(PAYOUTS[selected.size] || {}).map(([match, mult]) => (
            <div key={match} className="flex justify-between text-xs py-0.5">
              <span className="text-white/50">{match} {t("match", "মিল")}</span>
              <span className="font-bold text-amber-300">{mult}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
