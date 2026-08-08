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
import { sound } from "@/lib/sounds";

type PlinkoResult = {
  slots: number[];
  slot: number;
  multiplier: number;
  payout: number;
  balance: number;
  path?: number[];
};

const ROWS = 8;

export function PlinkoGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<PlinkoResult | null>(null);
  const [error, setError] = useState("");
  const [dropKey, setDropKey] = useState(0);
  const [ballX, setBallX] = useState(50);

  const slots = result?.slots || [0.2, 0.5, 1, 1.5, 3, 5, 3, 1.5, 1, 0.5, 0.2];
  const pegs = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: row + 3 }, (_, col) => ({ row, col }))
      ),
    []
  );

  async function play() {
    if (!user || loading || dropping) return;
    await sound.unlock();
    sound.bet();
    setLoading(true);
    setDropping(true);
    setError("");
    setResult(null);
    setBallX(50);
    try {
      const res = await fetch("/api/games/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Drop failed", "ড্রপ ব্যর্থ"), json.error);
        setDropping(false);
        setLoading(false);
        return;
      }
      setDropKey((k) => k + 1);
      const target = json.data.slot as number;
      const targetPct = ((target + 0.5) / slots.length) * 100;
      // animate ball toward slot
      const steps = 12;
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 70));
        const wobble = Math.sin(i * 1.7) * (8 - i * 0.4);
        setBallX(50 + (targetPct - 50) * (i / steps) + wobble);
        sound.spin();
      }
      setResult(json.data);
      setBalance(json.data.balance);
      setDropping(false);
      if (json.data.payout > amount) {
        sound.win();
        toast.success(
          t("Landed", "ল্যান্ড হয়েছে"),
          `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
        );
      } else {
        sound.lose();
      }
    } catch {
      setError("Network error");
      setDropping(false);
    }
    setLoading(false);
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
      <div className="relative overflow-hidden rounded-[1.4rem] border border-teal-500/20 bg-gradient-to-b from-[#042f2e] via-[#022c22] to-black p-4 shadow-card min-h-[320px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.22),transparent_55%)]" />
        <div className="relative mb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-200/60">
            Plinko
          </div>
          <div className="text-sm font-semibold text-white/70">
            {t("Drop the ball · hit a multiplier", "বল ড্রপ করুন · মাল্টিপ্লায়ার হিট")}
          </div>
        </div>

        <div className="relative mx-auto h-[210px] w-full max-w-[320px]">
          {/* pegs */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-2">
            {pegs.map((row, ri) => (
              <div key={ri} className="flex items-center justify-center gap-3 sm:gap-4">
                {row.map((p) => (
                  <span
                    key={`${p.row}-${p.col}`}
                    className="h-1.5 w-1.5 rounded-full bg-amber-300/80 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                  />
                ))}
              </div>
            ))}
          </div>

          {/* ball */}
          <AnimatePresence>
            {(dropping || result) && (
              <motion.div
                key={dropKey}
                className="absolute top-0 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                style={{ left: `${ballX}%` }}
                initial={{ top: 0, opacity: 1 }}
                animate={{ top: dropping ? "78%" : "86%", opacity: 1 }}
                transition={{ duration: dropping ? 0.85 : 0.2, ease: "easeIn" }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="relative mt-1 flex justify-center gap-0.5 overflow-x-auto pb-1">
          {slots.map((s, i) => {
            const hot = s >= 3;
            const mid = s >= 1 && s < 3;
            return (
              <div
                key={i}
                className={cn(
                  "min-w-[28px] rounded-md px-1.5 py-2 text-center text-[10px] font-black border transition-all duration-300",
                  result?.slot === i && !dropping
                    ? "scale-110 border-amber-300 bg-amber-400 text-emerald-950 shadow-[0_0_16px_rgba(251,191,36,0.55)]"
                    : hot
                      ? "border-rose-500/40 bg-rose-950/70 text-rose-200"
                      : mid
                        ? "border-amber-500/30 bg-amber-950/50 text-amber-100"
                        : "border-white/10 bg-black/40 text-white/70"
                )}
              >
                {s}x
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {result && !dropping && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative mt-3 text-center text-sm font-bold",
                result.payout > amount ? "text-emerald-400" : "text-amber-200/80"
              )}
            >
              {result.multiplier}x · {formatCoins(result.payout)} TK
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={loading || dropping}
        label={t("Drop ball", "বল ড্রপ")}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
