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

const FALLBACK_SLOTS = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.5, 1.2, 1, 0.8, 0.6, 0.4, 0.2];

export function PlinkoGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [slots, setSlots] = useState(FALLBACK_SLOTS);
  const [result, setResult] = useState<{
    slot: number;
    multiplier: number;
    payout: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [dropKey, setDropKey] = useState(0);
  const [ballPos, setBallPos] = useState({ x: 50, y: 0 });

  const rows = Math.max(8, slots.length - 1);
  const pegs = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) =>
        Array.from({ length: row + 3 }, (_, col) => ({ row, col }))
      ),
    [rows]
  );

  async function play() {
    if (!user || loading || dropping) return;
    await sound.unlock();
    sound.bet();
    setLoading(true);
    setDropping(true);
    setError("");
    setResult(null);
    setBallPos({ x: 50, y: 0 });
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

      const nextSlots: number[] = json.data.slots || slots;
      setSlots(nextSlots);
      const path: number[] = json.data.path || [];
      const targetSlot = json.data.slot as number;
      setDropKey((k) => k + 1);

      // animate along path
      let pos = 0;
      const totalRows = path.length || rows;
      for (let i = 0; i < totalRows; i++) {
        const dir = path[i] ?? (Math.random() > 0.5 ? 1 : 0);
        pos += dir;
        const maxPos = i + 2;
        const x = ((pos + 0.5) / (maxPos + 1)) * 100;
        const y = ((i + 1) / (totalRows + 1)) * 82;
        setBallPos({ x, y });
        sound.spin();
        await new Promise((r) => setTimeout(r, 90));
      }
      // settle into slot
      const finalX = ((targetSlot + 0.5) / nextSlots.length) * 100;
      setBallPos({ x: finalX, y: 90 });
      await new Promise((r) => setTimeout(r, 120));

      setResult({
        slot: targetSlot,
        multiplier: json.data.multiplier,
        payout: json.data.payout,
      });
      setBalance(json.data.balance);
      setDropping(false);
      if (json.data.payout > amount) {
        sound.win();
        toast.success(
          t("Landed", "ল্যান্ড হয়েছে"),
          `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
        );
      } else if (json.data.payout > 0) {
        sound.cashout();
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
      <div className="relative overflow-hidden rounded-[1.5rem] border border-teal-400/20 bg-gradient-to-b from-[#042f2e] via-[#021a1a] to-black p-4 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.2),transparent_55%)]" />
        <div className="relative mb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-200/60">
            Plinko
          </div>
          <div className="text-sm font-semibold text-white/70">
            {t("Drop · bounce · prize pocket", "ড্রপ · বাউন্স · প্রাইজ পকেট")}
          </div>
        </div>

        <div className="relative mx-auto h-[240px] w-full max-w-[340px]">
          {/* peg pyramid */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-3">
            {pegs.map((row, ri) => (
              <div key={ri} className="flex items-center justify-center gap-[10px] sm:gap-3">
                {row.map((p) => (
                  <span
                    key={`${p.row}-${p.col}`}
                    className="h-[5px] w-[5px] rounded-full bg-amber-300/85 shadow-[0_0_6px_rgba(251,191,36,0.75)]"
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
                className="absolute z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,1)]"
                style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                animate={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                transition={{ duration: 0.08, ease: "linear" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* prize pockets */}
        <div className="relative mt-2 flex justify-center gap-[2px] overflow-x-auto pb-1">
          {slots.map((s, i) => {
            const hot = s >= 5;
            const mid = s >= 1.5 && s < 5;
            const active = result?.slot === i && !dropping;
            return (
              <div
                key={i}
                className={cn(
                  "min-w-[24px] flex-1 max-w-[36px] rounded-md px-0.5 py-2 text-center text-[9px] font-black border transition-all duration-300",
                  active
                    ? "scale-110 border-amber-300 bg-amber-400 text-emerald-950 shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                    : hot
                      ? "border-rose-400/40 bg-rose-950/70 text-rose-100"
                      : mid
                        ? "border-teal-400/30 bg-teal-950/60 text-teal-100"
                        : "border-white/10 bg-black/40 text-white/65"
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
