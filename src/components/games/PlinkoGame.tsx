"use client";

import { useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function PlinkoGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function play() {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/games/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error);
      else {
        setResult(json.data);
        setBalance(json.data.balance);
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

  const slots = result?.slots || [0.2, 0.5, 1, 1.5, 3, 5, 3, 1.5, 1, 0.5, 0.2];

  return (
    <div className="space-y-4">
      <div className="premium-card min-h-[220px] bg-gradient-to-b from-teal-950 to-black">
        <div className="text-center text-5xl mb-4">🟢</div>
        <div className="flex justify-center gap-1 flex-wrap">
          {slots.map((s: number, i: number) => (
            <div
              key={i}
              className={`rounded-lg px-2 py-2 text-[10px] font-bold border ${
                result?.slot === i
                  ? "bg-gold-500 text-emerald-950 border-gold-300 scale-110"
                  : "bg-emerald-950 border-emerald-800 text-emerald-100"
              }`}
            >
              {s}x
            </div>
          ))}
        </div>
        {result && (
          <p className={`mt-4 text-center font-bold ${result.payout > amount ? "text-emerald-400" : "text-amber-300"}`}>
            {result.multiplier}x · {formatCoins(result.payout)} TC
          </p>
        )}
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={loading} label={t("Drop", "ড্রপ")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
