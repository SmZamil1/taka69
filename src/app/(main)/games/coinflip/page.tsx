"use client";

import { useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Side = "heads" | "tails";

export default function CoinFlipPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [pick, setPick] = useState<Side | null>(null);
  const [amount, setAmount] = useState(100);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ side: Side; won: boolean; payout: number } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<Side[]>([]);

  async function flip() {
    if (!user || !pick) return;
    setFlipping(true);
    setSpinning(true);
    setResult(null);
    try {
      const res = await fetch("/api/games/coinflip", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ pick, amount }),
      });
      const json = await res.json();
      await new Promise(r => setTimeout(r, 1200));
      setSpinning(false);
      if (!json.ok) { toast.error(json.error || "Failed"); setFlipping(false); return; }
      const r = json.data;
      setResult(r);
      setHistory(h => [r.side, ...h].slice(0, 20));
      if (r.won) toast.success(t("You won!", "জিতেছেন!"), `+${r.payout} TK`);
      else toast.info(t(`It was ${r.side}!`, `${r.side === "heads" ? "হেডস" : "টেইলস"} এসেছে!`));
    } catch { toast.error("Network error"); setSpinning(false); }
    setFlipping(false);
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-black text-amber-300">{t("Coin Flip", "কয়েন ফ্লিপ")}</h1>
        <p className="text-xs text-white/40">{t("50/50 · 1.96x payout", "৫০/৫০ · ১.৯৬x পেআউট")}</p>
      </div>

      {/* Coin */}
      <div className="flex justify-center">
        <div className={cn(
          "w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 transition-all duration-300",
          spinning ? "animate-spin border-amber-400" :
          result?.side === "heads" ? "border-amber-400 bg-amber-400/20" :
          result?.side === "tails" ? "border-slate-400 bg-slate-400/20" :
          "border-white/20 bg-white/5"
        )}>
          {spinning ? "..." : result?.side === "heads" ? "H" : result?.side === "tails" ? "T" : "CF"}
        </div>
      </div>

      {/* Pick */}
      <div className="grid grid-cols-2 gap-3">
        {(["heads","tails"] as Side[]).map(s => (
          <button key={s} onClick={() => setPick(s)}
            className={cn(
              "rounded-2xl py-4 text-sm font-black transition-all",
              pick === s ? "bg-amber-400 text-emerald-950 scale-105 shadow-lg" : "bg-white/8 text-white hover:bg-white/15"
            )}
          >
            {s === "heads" ? t("Heads","হেডস") : t("Tails","টেইলস")}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="flex gap-2">
        {[50,100,500,1000].map(a => (
          <button key={a} onClick={() => setAmount(a)}
            className={cn("flex-1 rounded-xl py-2 text-xs font-bold",
              amount === a ? "bg-amber-400 text-emerald-950" : "bg-white/8 text-white hover:bg-white/15"
            )}>{a}</button>
        ))}
      </div>

      <Button variant="gold" className="w-full font-black" disabled={flipping || !pick} onClick={flip}>
        {flipping ? t("Flipping...", "ফ্লিপ হচ্ছে...") : `${t("Flip","ফ্লিপ")} · ${amount} TK → ${(amount*1.96).toFixed(0)} TK`}
      </Button>

      {result && (
        <div className={cn("rounded-2xl border p-4 text-center",
          result.won ? "border-amber-400/30 bg-amber-400/10" : "border-rose-500/20 bg-rose-500/10"
        )}>
          <div className="text-xl font-black text-white">
            {result.side === "heads" ? "Heads" : "Tails"}
          </div>
          {result.won
            ? <div className="text-lg font-black text-amber-300">+{result.payout} TK 🎉</div>
            : <div className="text-sm text-white/50 mt-1">{t("Better luck next time!", "পরের বার!")}</div>
          }
        </div>
      )}

      {/* History */}
      <div className="flex flex-wrap gap-1.5">
        {history.map((s, i) => (
          <span key={i} className={cn("text-sm", s === "heads" ? "text-amber-300" : "text-slate-300")}>
            {s === "heads" ? "H" : "T"}
          </span>
        ))}
      </div>
    </div>
  );
}
