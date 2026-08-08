"use client";

import { useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function HiLoGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const [amount, setAmount] = useState(10);
  const [current, setCurrent] = useState(7);
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<any>(null);
  const [error, setError] = useState("");

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
      if (!json.ok) setError(json.error);
      else {
        setLast(json.data);
        setCurrent(json.data.next);
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

  return (
    <div className="space-y-4">
      <div className="premium-card text-center bg-gradient-to-b from-sky-950 to-black min-h-[180px] flex flex-col items-center justify-center">
        <div className="text-xs text-sky-200/70 mb-2">{t("Current card", "বর্তমান কার্ড")}</div>
        <div className="flex h-28 w-20 items-center justify-center rounded-xl bg-white text-4xl font-black text-slate-900 shadow-xl">
          {last?.next ?? current}
        </div>
        {last && (
          <p className={`mt-3 font-bold ${last.won ? "text-emerald-400" : "text-rose-400"}`}>
            {last.won ? `+${formatCoins(last.payout)} TC` : t("Lose", "হার")} · was {last.current} → {last.next}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="soft" disabled={loading} onClick={() => play("lower")}>{t("Lower", "নিচে")}</Button>
        <Button variant="gold" disabled={loading} onClick={() => play("same")}>{t("Same", "সমান")}</Button>
        <Button disabled={loading} onClick={() => play("higher")}>{t("Higher", "উপরে")}</Button>
      </div>
      <BetControls amount={amount} setAmount={setAmount} onBet={() => play("higher")} disabled={loading} label={t("Stake", "স্টেক")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
