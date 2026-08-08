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
import { Gem, Zap } from "lucide-react";

export function MinesGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [mineCount, setMineCount] = useState(5);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[]>([]);
  const [mult, setMult] = useState(1);
  const [busted, setBusted] = useState(false);
  const [done, setDone] = useState(false);
  const [payout, setPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    setBusted(false);
    setDone(false);
    setRevealed([]);
    setMines([]);
    setMult(1);
    setPayout(0);
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, mineCount }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Failed", "ব্যর্থ"), json.error);
        setLoading(false);
        return;
      }
      setRoundId(json.data.roundId);
      setBalance(json.data.balance);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function reveal(tile: number) {
    if (!roundId || busted || done || revealed.includes(tile) || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reveal", roundId, tile }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        setLoading(false);
        return;
      }
      setRevealed(json.data.revealed);
      if (json.data.busted) {
        setBusted(true);
        setMines(json.data.mines);
        setDone(true);
        setBalance(json.data.balance);
        toast.error(t("Boom", "বুম"), t("You hit a mine", "আপনি মাইনে আঘাত করেছেন"));
      } else {
        setMult(json.data.multiplier);
        setPayout(json.data.potentialPayout);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function cashout() {
    if (!roundId || !revealed.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cashout", roundId }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        setLoading(false);
        return;
      }
      setDone(true);
      setMines(json.data.mines);
      setPayout(json.data.payout);
      setMult(json.data.multiplier);
      setBalance(json.data.balance);
      toast.success(t("Cashed out", "ক্যাশ আউট হয়েছে"), `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`);
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

  const active = !!roundId && !done;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-emerald-200/80">
          {t("Mines", "মাইনস")}: {mineCount}
        </span>
        <span className="font-bold text-gold-300">{mult.toFixed(2)}x</span>
      </div>

      {!active && !done && (
        <>
          <input
            type="range"
            min={1}
            max={24}
            value={mineCount}
            onChange={(e) => setMineCount(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <BetControls amount={amount} setAmount={setAmount} onBet={start} disabled={loading} label={t("Start", "শুরু")} />
        </>
      )}

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => {
          const isRev = revealed.includes(i);
          const isMine = mines.includes(i);
          return (
            <button
              key={i}
              disabled={!active || isRev}
              onClick={() => reveal(i)}
              className={cn(
                "relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border font-bold transition-all duration-200",
                isRev && !isMine && "bg-emerald-600 border-emerald-400 shadow-glow",
                isMine && "bg-rose-700 border-rose-400 shadow-ruby",
                !isRev && !isMine && "bg-emerald-950 border-emerald-800 hover:border-gold-400/40 hover:bg-emerald-900 active:scale-95",
                done && !isRev && !isMine && "opacity-50"
              )}
            >
              <AnimatePresence>
                {(isRev || isMine) && (
                  <motion.div
                    initial={{ scale: 0, rotate: -30, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  >
                    {isMine ? (
                      <Zap className="h-5 w-5 text-white" fill="currentColor" />
                    ) : (
                      <Gem className="h-5 w-5 text-white" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {active && (
        <Button size="lg" className="w-full" onClick={cashout} disabled={!revealed.length || loading}>
          {t("Cash out", "ক্যাশ আউট")} {formatCoins(payout)} TK
        </Button>
      )}

      {done && (
        <div className="text-center space-y-2 animate-pop-in">
          <p className={busted ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
            {busted ? t("Boom", "বুম") : `+${formatCoins(payout)} TK`}
          </p>
          <Button onClick={() => { setRoundId(null); setDone(false); setBusted(false); }}>
            {t("Play again", "আবার খেলুন")}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
