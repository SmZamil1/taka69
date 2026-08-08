"use client";

import { useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function SlotsGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const [amount, setAmount] = useState(10);
  const [reels, setReels] = useState(["❓", "❓", "❓"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean } | null>(null);
  const [error, setError] = useState("");

  async function play() {
    if (!user) return;
    setSpinning(true);
    setError("");
    setResult(null);
    const flash = setInterval(() => {
      const pool = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
      setReels([0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]));
    }, 80);
    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      clearInterval(flash);
      if (!json.ok) {
        setError(json.error);
        setSpinning(false);
        return;
      }
      setReels(json.data.reels);
      setResult({
        mult: json.data.multiplier,
        payout: json.data.payout,
        won: json.data.won,
      });
      setBalance(json.data.balance);
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
      <div className="rounded-2xl border border-fuchsia-700/40 bg-gradient-to-b from-fuchsia-950 to-black p-6">
        <div className="flex justify-center gap-3">
          {reels.map((r, i) => (
            <div
              key={i}
              className="flex h-24 w-20 items-center justify-center rounded-2xl bg-black/50 border border-fuchsia-500/30 text-5xl shadow-inner"
            >
              {r}
            </div>
          ))}
        </div>
        {result && (
          <p className={`mt-4 text-center font-bold ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
            {result.won ? `${result.mult}x · +${formatCoins(result.payout)} TC` : t("Try again", "আবার চেষ্টা")}
          </p>
        )}
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={spinning} label={t("Spin", "স্পিন")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
