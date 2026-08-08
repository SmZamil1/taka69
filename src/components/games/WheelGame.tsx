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
import { ChevronDown, Sparkles } from "lucide-react";

const SEGMENTS = [0, 1.2, 0, 1.5, 0, 2, 0, 3, 0, 5, 0, 10, 0, 1.2, 0, 20];

export function WheelGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean } | null>(null);
  const [error, setError] = useState("");

  async function play() {
    if (!user) return;
    setSpinning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/games/wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Spin failed", "স্পিন ব্যর্থ"), json.error);
        setSpinning(false);
        return;
      }
      const idx = json.data.index as number;
      const seg = 360 / SEGMENTS.length;
      const extra = 360 * 5;
      const target = extra + (360 - idx * seg - seg / 2);
      setRotation((r) => r + target);
      setTimeout(() => {
        setResult({ mult: json.data.multiplier, payout: json.data.payout, won: json.data.won });
        setBalance(json.data.balance);
        setSpinning(false);
        if (json.data.won) toast.success(t("Winner", "বিজয়ী"), `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`);
      }, 4200);
    } catch {
      setError("Network error");
      setSpinning(false);
    }
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
      <div className="relative mx-auto h-64 w-64">
        <div className="pointer-events-none absolute inset-[-14px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_70%)] animate-pulse-slow" />
        <motion.div
          className="absolute left-1/2 -top-3 z-10 -translate-x-1/2"
          animate={spinning ? { y: [0, 3, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.4 }}
        >
          <ChevronDown className="h-7 w-7 text-gold-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </motion.div>
        <div
          className="relative h-full w-full rounded-full border-4 border-gold-400 shadow-gold transition-transform ease-out"
          style={{
            transitionDuration: spinning ? "4s" : "0s",
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${SEGMENTS.map((m, i) => {
              const colors = ["#0c4a6e", "#b45309", "#0f172a", "#075985"];
              return `${colors[i % colors.length]} ${(i / SEGMENTS.length) * 100}% ${((i + 1) / SEGMENTS.length) * 100}%`;
            }).join(", ")})`,
          }}
        >
          {SEGMENTS.map((m, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-bottom text-[10px] font-bold text-white"
              style={{
                height: "48%",
                transform: `translateX(-50%) rotate(${(i + 0.5) * (360 / SEGMENTS.length)}deg)`,
              }}
            >
              {m === 0 ? "×" : `${m}x`}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-gold-300 bg-surface-950 shadow-gold" />
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex items-center justify-center gap-1.5 text-center font-bold",
              result.won ? "text-emerald-400" : "text-rose-400/80"
            )}
          >
            {result.won && <Sparkles className="h-4 w-4" />}
            {result.won ? `${result.mult}x · +${formatCoins(result.payout)} TK` : t("No win", "জয় নেই")}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={spinning} label={t("Spin", "স্পিন")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
