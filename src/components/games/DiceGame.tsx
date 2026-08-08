"use client";

import { useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DiceGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const [amount, setAmount] = useState(10);
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<"under" | "over">("under");
  const [loading, setLoading] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [last, setLast] = useState<{ won: boolean; payout: number; mult: number } | null>(null);
  const [error, setError] = useState("");

  const winChance = condition === "under" ? target : 100 - target;
  const mult = Math.floor(((100 - 1) / Math.max(1, winChance)) * 100) / 100;

  async function play() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/games/dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, target, condition }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        setLoading(false);
        return;
      }
      setRoll(json.data.roll);
      setLast({ won: json.data.won, payout: json.data.payout, mult: json.data.multiplier });
      setBalance(json.data.balance);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="text-center p-6 space-y-3">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-800/50 bg-gradient-to-b from-indigo-950 to-black p-6 text-center min-h-[180px] flex flex-col items-center justify-center">
        <div className="text-6xl font-black text-white tabular-nums">
          {roll === null ? "—" : roll.toFixed(2)}
        </div>
        {last && (
          <div className={cn("mt-2 font-semibold", last.won ? "text-emerald-400" : "text-rose-400")}>
            {last.won ? `+${formatCoins(last.payout)} TC` : t("Lose", "হার")}
          </div>
        )}
        <p className="mt-2 text-xs text-indigo-200/70">
          {condition === "under" ? "<" : ">"} {target} · ~{mult.toFixed(2)}x · {winChance}%
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCondition("under")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold",
            condition === "under" ? "bg-emerald-500 text-white" : "bg-emerald-950 text-emerald-200"
          )}
        >
          {t("Roll under", "নিচে")}
        </button>
        <button
          onClick={() => setCondition("over")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold",
            condition === "over" ? "bg-rose-500 text-white" : "bg-emerald-950 text-emerald-200"
          )}
        >
          {t("Roll over", "উপরে")}
        </button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-emerald-200/70 mb-1">
          <span>1</span>
          <span className="font-bold text-gold-300">{target}</span>
          <span>99</span>
        </div>
        <input
          type="range"
          min={1}
          max={98}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full accent-gold-400"
        />
      </div>

      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={loading} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
