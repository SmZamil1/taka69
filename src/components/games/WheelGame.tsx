"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { sound } from "@/lib/sounds";

const FALLBACK = [0, 1.5, 0, 2, 1.2, 3, 0, 5, 1.2, 8, 0, 12, 1.5, 2, 0, 25];

const SEG_COLORS = [
  "#111827",
  "#d97706",
  "#0f172a",
  "#0284c7",
  "#1e293b",
  "#ca8a04",
  "#111827",
  "#0d9488",
  "#1e293b",
  "#ea580c",
  "#0f172a",
  "#7c3aed",
  "#1e293b",
  "#b45309",
  "#111827",
  "#e11d48",
];

export function WheelGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState(FALLBACK);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean } | null>(null);
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState<number | null>(null);

  const conic = useMemo(() => {
    const n = segments.length;
    return segments
      .map((_, i) => {
        const a = (i / n) * 100;
        const b = ((i + 1) / n) * 100;
        return `${SEG_COLORS[i % SEG_COLORS.length]} ${a}% ${b}%`;
      })
      .join(", ");
  }, [segments]);

  async function play() {
    if (!user || spinning) return;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setHighlight(null);
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
      if (Array.isArray(json.data.segments)) setSegments(json.data.segments);
      const segs: number[] = json.data.segments || segments;
      const idx = json.data.index as number;
      const n = segs.length;
      const seg = 360 / n;
      // pointer at top; rotate so segment center lands under pointer
      const extra = 360 * 7;
      const target = extra + (360 - (idx * seg + seg / 2));
      setRotation((r) => r + target);

      let ticks = 0;
      const iv = window.setInterval(() => {
        sound.spin();
        ticks += 1;
        if (ticks > 22) window.clearInterval(iv);
      }, 160);

      window.setTimeout(() => {
        window.clearInterval(iv);
        setHighlight(idx);
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
      }, 4800);
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
      <div className="relative overflow-hidden rounded-[1.5rem] border border-amber-400/20 bg-gradient-to-b from-[#1a1205] via-[#0b0a08] to-black p-5 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.18),transparent_55%)]" />
        <div className="relative mb-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/60">
            Fortune Wheel
          </div>
          <div className="text-sm font-semibold text-white/70">
            {t("Spin for multipliers", "মাল্টিপ্লায়ারের জন্য স্পিন")}
          </div>
        </div>

        <div className="relative mx-auto flex h-[300px] w-full max-w-[300px] items-center justify-center">
          {/* outer ring */}
          <div className="absolute h-[286px] w-[286px] rounded-full border-[10px] border-[#3f2a0a] shadow-[0_0_40px_rgba(251,191,36,0.2)]" />
          <div className="absolute h-[270px] w-[270px] rounded-full border border-amber-300/40" />

          {/* pointer */}
          <div className="absolute top-1 z-30 flex flex-col items-center">
            <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
          </div>

          {/* wheel */}
          <div
            className="relative z-10 h-[250px] w-[250px] rounded-full border-[5px] border-amber-200/80 shadow-inner"
            style={{
              background: `conic-gradient(${conic})`,
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4.6s cubic-bezier(0.12, 0.82, 0.08, 1)"
                : "none",
            }}
          >
            {segments.map((m, i) => {
              const ang = (i + 0.5) * (360 / segments.length);
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute left-1/2 top-1/2 origin-bottom text-[11px] font-black drop-shadow",
                    highlight === i ? "text-amber-200 scale-110" : "text-white"
                  )}
                  style={{
                    height: "46%",
                    transform: `translateX(-50%) rotate(${ang}deg)`,
                  }}
                >
                  {m === 0 ? "×" : `${m}x`}
                </div>
              );
            })}
            {/* hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-b from-[#1f2937] to-black text-[10px] font-black tracking-widest text-amber-200 shadow-gold">
                SPIN
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold",
                result.won ? "text-emerald-400" : "text-rose-300/80"
              )}
            >
              {result.won && <Sparkles className="h-4 w-4" />}
              {result.won
                ? `${result.mult}x · +${formatCoins(result.payout)} TK`
                : t("No win this spin", "এই স্পিনে জয় নেই")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
