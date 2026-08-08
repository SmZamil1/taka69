"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { Circle, Square, Triangle, Hexagon, Star, Gem, Crown, type LucideIcon } from "lucide-react";

const SLOT_SYMBOLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];

const SYMBOL_META: Record<string, { icon: LucideIcon; color: string; glow: string }> = {
  S1: { icon: Circle, color: "text-rose-400", glow: "drop-shadow-[0_0_10px_rgba(251,113,133,0.6)]" },
  S2: { icon: Square, color: "text-yellow-300", glow: "drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]" },
  S3: { icon: Triangle, color: "text-orange-400", glow: "drop-shadow-[0_0_10px_rgba(251,146,60,0.6)]" },
  S4: { icon: Hexagon, color: "text-violet-400", glow: "drop-shadow-[0_0_10px_rgba(167,139,250,0.6)]" },
  S5: { icon: Star, color: "text-sky-300", glow: "drop-shadow-[0_0_10px_rgba(125,211,252,0.6)]" },
  S6: { icon: Gem, color: "text-emerald-300", glow: "drop-shadow-[0_0_12px_rgba(110,231,183,0.7)]" },
  S7: { icon: Crown, color: "text-gold-400", glow: "drop-shadow-[0_0_14px_rgba(251,191,36,0.8)]" },
};

function Symbol({ sym, big = false }: { sym: string; big?: boolean }) {
  const meta = SYMBOL_META[sym] ?? SYMBOL_META.S1;
  const Icon = meta.icon;
  return <Icon className={cn(big ? "h-11 w-11" : "h-9 w-9", meta.color, meta.glow)} strokeWidth={1.75} />;
}

export function SlotsGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [reels, setReels] = useState<string[]>(["S1", "S2", "S3"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean; big?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [spinKey, setSpinKey] = useState(0);

  async function play() {
    if (!user) return;
    setSpinning(true);
    setError("");
    setResult(null);
    setSpinKey((k) => k + 1);
    const flash = setInterval(() => {
      setReels([0, 1, 2].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]));
    }, 70);
    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, 650));
      clearInterval(flash);
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Spin failed", "স্পিন ব্যর্থ"), json.error);
        setSpinning(false);
        return;
      }
      setReels(json.data.reels);
      setResult({
        mult: json.data.multiplier,
        payout: json.data.payout,
        won: json.data.won,
        big: json.data.bigPrize,
      });
      setBalance(json.data.balance);
      if (json.data.won) {
        toast.success(
          json.data.bigPrize ? t("Big prize", "বিগ প্রাইজ") : t("Winner", "বিজয়ী"),
          `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
        );
      }
    } catch {
      clearInterval(flash);
      setError("Network error");
    }
    setSpinning(false);
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
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-700/40 bg-gradient-to-b from-fuchsia-950 via-black to-black p-6 shadow-card">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.35),transparent_60%)]" />
        <div className="relative flex justify-center gap-3">
          {reels.map((r, i) => (
            <div
              key={i}
              className="relative flex h-24 w-20 items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-black/60 shadow-inner"
            >
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={`${spinKey}-${i}-${r}`}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.05 }}
                >
                  <Symbol sym={r} big />
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {result && (
            <motion.p
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("mt-4 text-center font-bold", result.won ? "text-emerald-400" : "text-rose-400/80")}
            >
              {result.won
                ? `${result.big ? "BIG · " : ""}${result.mult}x · +${formatCoins(result.payout)} TK`
                : t("Try again", "আবার চেষ্টা")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={spinning} label={t("Spin", "স্পিন")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
