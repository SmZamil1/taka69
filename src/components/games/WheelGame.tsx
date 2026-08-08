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
import { sound } from "@/lib/sounds";

const SEGMENTS = [0, 1.2, 0, 1.5, 0, 2, 0, 3, 0, 5, 0, 10, 0, 1.2, 0, 20];
const COLORS = [
  "#0b1220",
  "#b45309",
  "#111827",
  "#0369a1",
  "#0b1220",
  "#a16207",
  "#111827",
  "#0e7490",
  "#0b1220",
  "#c2410c",
  "#111827",
  "#7c3aed",
  "#0b1220",
  "#a16207",
  "#111827",
  "#be123c",
];

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
    if (!user || spinning) return;
    await sound.unlock();
    sound.bet();
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
      const extra = 360 * 6;
      const target = extra + (360 - idx * seg - seg / 2);
      setRotation((r) => r + target);
      // tick sounds during spin
      let ticks = 0;
      const iv = window.setInterval(() => {
        sound.spin();
        ticks += 1;
        if (ticks > 18) window.clearInterval(iv);
      }, 180);
      setTimeout(() => {
        window.clearInterval(iv);
        setResult({ mult: json.data.multiplier, payout: json.data.payout, won: json.data.won });
        setBalance(json.data.balance);
        setSpinning(false);
        if (json.data.won) {
          sound.win();
          toast.success(
            t("Winner", "বিজয়ী"),
            `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
          );
        } else {
          sound.lose();
        }
      }, 4500);
    } catch {
      setError("Network error");
      setSpinning(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button>{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto flex h-[300px] w-full max-w-[300px] items-center justify-center">
        <div className="pointer-events-none absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.18),transparent_70%)]" />
        <div className="absolute inset-0 rounded-full border border-white/10 bg-black/30 backdrop-blur-sm" />
        <motion.div
          className="absolute left-1/2 top-1 z-20 -translate-x-1/2"
          animate={spinning ? { y: [0, 4, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.35 }}
        >
          <ChevronDown className="h-8 w-8 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.85)]" />
        </motion.div>

        <div
          className="relative h-[250px] w-[250px] rounded-full border-[6px] border-amber-300/80 shadow-[0_0_40px_rgba(251,191,36,0.25)] transition-transform"
          style={{
            transitionDuration: spinning ? "4.4s" : "0s",
            transitionTimingFunction: "cubic-bezier(0.12, 0.75, 0.12, 1)",
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${SEGMENTS.map((_, i) => {
              const a = (i / SEGMENTS.length) * 100;
              const b = ((i + 1) / SEGMENTS.length) * 100;
              return `${COLORS[i % COLORS.length]} ${a}% ${b}%`;
            }).join(", ")})`,
          }}
        >
          {SEGMENTS.map((m, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-bottom text-[11px] font-black text-white drop-shadow"
              style={{
                height: "46%",
                transform: `translateX(-50%) rotate(${(i + 0.5) * (360 / SEGMENTS.length)}deg)`,
              }}
            >
              {m === 0 ? "×" : `${m}x`}
            </div>
          ))}
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-[#0b1220] text-[10px] font-black tracking-wider text-amber-200 shadow-gold">
            SPIN
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex items-center justify-center gap-1.5 text-center font-bold",
              result.won ? "text-emerald-400" : "text-rose-400/80"
            )}
          >
            {result.won && <Sparkles className="h-4 w-4" />}
            {result.won
              ? `${result.mult}x · +${formatCoins(result.payout)} TK`
              : t("No win", "জয় নেই")}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={spinning}
        label={t("Spin wheel", "চাকা ঘোরান")}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
