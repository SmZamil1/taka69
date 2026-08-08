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
import { Spade, ArrowUp, ArrowDown, Equal } from "lucide-react";

type HiLoResult = {
  won: boolean;
  payout: number;
  current: number;
  next: number;
  balance: number;
};

function CardFace({ value }: { value: number }) {
  const red = value % 2 === 0;
  return (
    <div
      className={cn(
        "flex h-28 w-20 flex-col items-center justify-center rounded-xl bg-white shadow-xl",
        red ? "text-rose-600" : "text-slate-900"
      )}
    >
      <span className="text-4xl font-black">{value}</span>
      <Spade className="mt-1 h-4 w-4 opacity-60" />
    </div>
  );
}

export function HiLoGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [current, setCurrent] = useState(7);
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<HiLoResult | null>(null);
  const [error, setError] = useState("");
  const [flipKey, setFlipKey] = useState(0);

  async function play(guess: "higher" | "lower" | "same") {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/games/hilo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, guess, current }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Failed", "ব্যর্থ"), json.error);
      } else {
        setLast(json.data);
        setCurrent(json.data.next);
        setFlipKey((k) => k + 1);
        setBalance(json.data.balance);
        if (json.data.won) toast.success(t("Correct", "সঠিক"), `+${formatCoins(json.data.payout)} TC`);
      }
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
      <div className="relative overflow-hidden rounded-2xl border border-sky-800/40 bg-gradient-to-b from-sky-950 via-sky-950 to-black p-6 text-center min-h-[200px] flex flex-col items-center justify-center shadow-card">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_10%,rgba(56,189,248,0.25),transparent_65%)]" />
        <div className="relative text-xs text-sky-200/70 mb-3">{t("Current card", "বর্তমান কার্ড")}</div>
        <div className="relative" style={{ perspective: 800 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={flipKey}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <CardFace value={last?.next ?? current} />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {last && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("relative mt-3 flex items-center gap-1.5 font-bold", last.won ? "text-emerald-400" : "text-rose-400")}
            >
              {last.won ? `+${formatCoins(last.payout)} TC` : t("Lose", "হার")}
              <span className="text-sky-200/60 font-normal">
                · {last.current} → {last.next}
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="soft" disabled={loading} onClick={() => play("lower")} className="flex items-center justify-center gap-1.5">
          <ArrowDown className="h-4 w-4" />
          {t("Lower", "নিচে")}
        </Button>
        <Button variant="gold" disabled={loading} onClick={() => play("same")} className="flex items-center justify-center gap-1.5">
          <Equal className="h-4 w-4" />
          {t("Same", "সমান")}
        </Button>
        <Button disabled={loading} onClick={() => play("higher")} className="flex items-center justify-center gap-1.5">
          <ArrowUp className="h-4 w-4" />
          {t("Higher", "উপরে")}
        </Button>
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={() => play("higher")} disabled={loading} label={t("Stake", "স্টেক")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
