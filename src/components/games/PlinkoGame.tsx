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
import { Circle } from "lucide-react";

type PlinkoResult = {
  slots: number[];
  slot: number;
  multiplier: number;
  payout: number;
  balance: number;
};

const PEG_ROWS = 6;

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

  async function play() {
    if (!user) return;
    setLoading(true);
    setDropping(true);
    setError("");
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
      } else {
        setDropKey((k) => k + 1);
        setTimeout(() => {
          setResult(json.data);
          setBalance(json.data.balance);
          setDropping(false);
          if (json.data.payout > amount) toast.success(t("Landed", "ল্যান্ড হয়েছে"), `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`);
        }, 1200);
      }
    } catch {
      setError("Network error");
      setDropping(false);
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

  const slots = result?.slots || [0.2, 0.5, 1, 1.5, 3, 5, 3, 1.5, 1, 0.5, 0.2];
  const targetSlot = result?.slot ?? Math.floor(slots.length / 2);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-teal-800/40 bg-gradient-to-b from-teal-950 via-emerald-950 to-black p-5 min-h-[260px] shadow-card">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.3),transparent_60%)]" />

        <div className="relative mx-auto flex max-w-[280px] flex-col items-center gap-3 py-2">
          {Array.from({ length: PEG_ROWS }, (_, row) => (
            <div key={row} className="flex gap-4" style={{ marginLeft: row % 2 === 0 ? 0 : 10 }}>
              {Array.from({ length: 5 + (row % 2 === 0 ? 0 : 1) }, (_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-gold-400/70 shadow-gold" />
              ))}
            </div>
          ))}

          <AnimatePresence>
            {dropping && (
              <motion.div
                key={dropKey}
                className="absolute left-1/2 top-0"
                initial={{ y: -10, x: "-50%", opacity: 1 }}
                animate={{
                  y: [0, 40, 90, 140, 175],
                  x: [
                    "-50%",
                    `calc(-50% + ${(Math.random() - 0.5) * 40}px)`,
                    `calc(-50% + ${((targetSlot - slots.length / 2) / (slots.length / 2)) * 60}px)`,
                    `calc(-50% + ${((targetSlot - slots.length / 2) / (slots.length / 2)) * 90}px)`,
                    `calc(-50% + ${((targetSlot - slots.length / 2) / (slots.length / 2)) * 110}px)`,
                  ],
                }}
                transition={{ duration: 1.1, ease: "easeIn" }}
              >
                <Circle className="h-4 w-4 fill-gold-400 text-gold-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative mt-2 flex justify-center gap-1 flex-wrap">
          {slots.map((s, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-2 py-2 text-[10px] font-bold border transition-all duration-300",
                result?.slot === i && !dropping
                  ? "bg-gold-500 text-emerald-950 border-gold-300 scale-110 shadow-gold"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-100"
              )}
            >
              {s}x
            </div>
          ))}
        </div>

        <AnimatePresence>
          {result && !dropping && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative mt-4 text-center font-bold",
                result.payout > amount ? "text-emerald-400" : "text-amber-300/80"
              )}
            >
              {result.multiplier}x · {formatCoins(result.payout)} TK
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={loading || dropping} label={t("Drop", "ড্রপ")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
