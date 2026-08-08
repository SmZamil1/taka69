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
import { Sparkles } from "lucide-react";
import { sound } from "@/lib/sounds";

const COLORS: Record<string, string> = {
  A: "from-rose-500 to-rose-800",
  B: "from-amber-400 to-orange-700",
  C: "from-sky-400 to-blue-800",
  D: "from-emerald-400 to-teal-800",
  E: "from-violet-400 to-purple-800",
  W: "from-yellow-300 to-amber-600",
};

export function ProviderGame({
  provider,
  titleEn,
  titleBn,
}: {
  provider: "jili" | "pg" | "spribe" | "evolution" | "fa_chai" | "jdb";
  titleEn: string;
  titleBn: string;
}) {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [symbols, setSymbols] = useState(["A", "B", "C", "D", "E"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean; big?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 2000 });

  async function play() {
    if (!user) return;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setKey((k) => k + 1);
    const flash = setInterval(() => {
      sound.spin();
      setSymbols(["A", "B", "C", "D", "E", "W"].sort(() => Math.random() - 0.5).slice(0, 5));
    }, 80);
    try {
      const res = await fetch("/api/games/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider, amount }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, 700));
      clearInterval(flash);
      if (!json.ok) {
        setError(json.error);
        sound.lose();
        toast.error(t("Spin failed", "স্পিন ব্যর্থ"), json.error);
        setSpinning(false);
        return;
      }
      setSymbols(json.data.symbols);
      setResult({
        mult: json.data.multiplier,
        payout: json.data.payout,
        won: json.data.won,
        big: json.data.bigPrize,
      });
      setBalance(json.data.balance);
      if (json.data.limits) setLimits(json.data.limits);
      if (json.data.won) {
        sound.win();
        toast.success(
          json.data.bigPrize ? t("Big prize", "বিগ প্রাইজ") : t("Winner", "বিজয়ী"),
          `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
        );
      } else {
        sound.lose();
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
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-gold-300/80">{provider.replace("_", " ")}</div>
        <h2 className="text-xl font-black text-white">{t(titleEn, titleBn)}</h2>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-emerald-800/50 bg-gradient-to-b from-emerald-950 via-black to-black p-5 shadow-card">
        <div className="grid grid-cols-5 gap-2">
          {symbols.map((s, i) => (
            <AnimatePresence mode="popLayout" key={`${key}-${i}`}>
              <motion.div
                initial={{ y: -30, opacity: 0, rotate: -8 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-inner border border-white/10",
                  COLORS[s] || COLORS.A
                )}
              >
                {s}
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 flex items-center justify-center gap-1.5 text-center font-bold",
                result.won ? "text-emerald-400" : "text-rose-400/80"
              )}
            >
              {result.won && <Sparkles className="h-4 w-4" />}
              {result.won
                ? `${result.big ? "BIG · " : ""}${result.mult}x · +${formatCoins(result.payout)} TK`
                : t("Try again", "আবার চেষ্টা")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={spinning}
        label={t("Spin", "স্পিন")}
        min={limits.minBet}
        max={limits.maxBet}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-[10px] text-center text-emerald-200/40">
        {t("Virtual TK · fair RNG · admin max-win caps", "ভার্চুয়াল TK · ফেয়ার RNG · অ্যাডমিন ম্যাক্স-উইন ক্যাপ")}
      </p>
    </div>
  );
}
