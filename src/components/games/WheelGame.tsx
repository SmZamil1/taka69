"use client";

import { useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const SEGMENTS = [0, 1.2, 0, 1.5, 0, 2, 0, 3, 0, 5, 0, 10, 0, 1.2, 0, 20];

export function WheelGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const [amount, setAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean } | null>(null);
  const [error, setError] = useState("");

  async function play() {
    if (!user) return;
    setSpinning(true);
    setError("");
    setResult(null);
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
        setSpinning(false);
        return;
      }
      const idx = json.data.index as number;
      const seg = 360 / SEGMENTS.length;
      const extra = 360 * 5;
      const target = extra + (360 - idx * seg - seg / 2);
      setRotation((r) => r + target);
      setTimeout(() => {
        setResult({
          mult: json.data.multiplier,
          payout: json.data.payout,
          won: json.data.won,
        });
        setBalance(json.data.balance);
        setSpinning(false);
      }, 4200);
    } catch {
      setError("Network error");
      setSpinning(false);
    }
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
      <div className="relative mx-auto w-64 h-64">
        <div className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 text-2xl">▼</div>
        <div
          className="h-full w-full rounded-full border-4 border-gold-400 shadow-gold transition-transform ease-out"
          style={{
            transitionDuration: spinning ? "4s" : "0s",
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(${SEGMENTS.map((m, i) => {
              const colors = ["#064e3b", "#b45309", "#0f172a", "#7c2d12"];
              return `${colors[i % colors.length]} ${(i / SEGMENTS.length) * 100}% ${((i + 1) / SEGMENTS.length) * 100}%`;
            }).join(", ")})`,
          }}
        >
          {SEGMENTS.map((m, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-bottom text-[10px] font-bold text-white"
              style={{
                height: "48%",
                transform: `translateX(-50%) rotate(${(i + 0.5) * (360 / SEGMENTS.length)}deg)`,
              }}
            >
              {m === 0 ? "×" : `${m}x`}
            </div>
          ))}
        </div>
      </div>

      {result && (
        <p className={`text-center font-bold ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
          {result.won ? `${result.mult}x · +${formatCoins(result.payout)} TC` : t("No win", "জয় নেই")}
        </p>
      )}

      <BetControls amount={amount} setAmount={setAmount} onBet={play} disabled={spinning} label={t("Spin", "স্পিন")} />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
