"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DiceGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [target, setTarget] = useState(50);
  const [condition, setCondition] = useState<"under" | "over">("under");
  const [loading, setLoading] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [last, setLast] = useState<{ won: boolean; payout: number; mult: number } | null>(null);
  const [error, setError] = useState("");
  const [rollKey, setRollKey] = useState(0);

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
        toast.error(t("Roll failed", "রোল ব্যর্থ"), json.error);
        setLoading(false);
        return;
      }
      setRoll(json.data.roll);
      setRollKey((k) => k + 1);
      setLast({ won: json.data.won, payout: json.data.payout, mult: json.data.multiplier });
      setBalance(json.data.balance);
      if (json.data.won) toast.success(t("You won", "আপনি জিতেছেন"), `+${formatCoins(json.data.payout)} TK`);
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
      <div className="relative overflow-hidden rounded-2xl border border-indigo-800/50 bg-gradient-to-b from-indigo-950 via-indigo-950 to-black p-6 text-center min-h-[180px] flex flex-col items-center justify-center shadow-card">
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_20%,rgba(129,140,248,0.25),transparent_65%)]" />
        <AnimatePresence mode="wait">
          <motion.div
            key={rollKey}
            initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={cn(
              "relative text-6xl font-black tabular-nums drop-shadow-lg",
              last ? (last.won ? "text-emerald-300" : "text-rose-300") : "text-white"
            )}
          >
            {roll === null ? "—" : roll.toFixed(2)}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {last && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("mt-2 font-semibold", last.won ? "text-emerald-400" : "text-rose-400")}
            >
              {last.won ? `+${formatCoins(last.payout)} TK` : t("Lose", "হার")}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-2 text-xs text-indigo-200/70">
          {condition === "under" ? "<" : ">"} {target} · ~{mult.toFixed(2)}x · {winChance}%
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCondition("under")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors duration-200",
            condition === "under" ? "bg-emerald-500 text-white shadow-glow" : "bg-emerald-950 text-emerald-200"
          )}
        >
          {t("Roll under", "নিচে")}
        </button>
        <button
          onClick={() => setCondition("over")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors duration-200",
            condition === "over" ? "bg-rose-500 text-white shadow-ruby" : "bg-emerald-950 text-emerald-200"
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
        <div className="relative">
          <input
            type="range"
            min={1}
            max={98}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-gold-400 relative z-10"
          />
          {roll !== null && (
            <motion.div
              className="pointer-events-none absolute -top-1.5 h-4 w-1 rounded-full bg-white/80 shadow-gold"
              animate={{ left: `${Math.min(99, Math.max(0, roll))}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            />
          )}
        </div>
      </div>

      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={loading} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
