"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

const SYMBOLS = ["A", "K", "Q", "J", "10", "★", "7", "💎"];

/** Neon Reels — wallet-connected 5x3 style grid using slots API (pixi-slots inspired) */
export default function PixiSlotsPage() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState(() =>
    Array.from({ length: 15 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );
  const [payout, setPayout] = useState(0);

  async function spin() {
    if (!user || spinning) return;
    setSpinning(true);
    setPayout(0);
    try {
      const res = await fetch("/api/games/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const j = await res.json();
      if (!j.ok) {
        toast.error(j.error || "Spin failed");
        setSpinning(false);
        return;
      }
      let n = 0;
      const id = window.setInterval(() => {
        setGrid(Array.from({ length: 15 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
        n += 1;
        if (n > 14) {
          window.clearInterval(id);
          const won = Number(j.data.payout || 0) > 0;
          setGrid(
            Array.from({ length: 15 }, (_, i) =>
              won && i % 5 === 2 ? "💎" : SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]
            )
          );
          setPayout(Number(j.data.payout || 0));
          if (typeof j.data.balance === "number") setBalance(j.data.balance);
          setSpinning(false);
          if (j.data.payout > 0) toast.success("Win!", `+${j.data.payout} BDT`);
        }
      }, 60);
    } catch {
      toast.error("Network error");
      setSpinning(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white/70">Login to play Neon Reels</p>
        <Link href="/login?next=/games/pixi-slots">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gradient-to-b from-violet-950 via-black to-black px-3 pb-10 pt-3 text-white">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/games" className="rounded-full border border-white/10 bg-white/5 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black">Neon Reels</div>
          <div className="text-[10px] uppercase tracking-wider text-violet-300/70">Pixi-style slots</div>
        </div>
        <div className="rounded-full border border-amber-400/30 bg-black/40 px-3 py-1.5 text-xs font-black text-amber-300">
          ৳{formatCoins(user.balance)}
        </div>
      </div>

      <div className="rounded-3xl border border-violet-400/25 bg-black/50 p-3 shadow-2xl">
        <div className="grid grid-cols-5 gap-1.5">
          {grid.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-violet-900/40 to-black text-lg font-black",
                spinning && "animate-pulse"
              )}
            >
              {s}
            </div>
          ))}
        </div>
        {payout > 0 && (
          <div className="mt-3 text-center text-sm font-black text-emerald-300">
            +{formatCoins(payout)} BDT
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex gap-2">
          {[10, 20, 50, 100, 200].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={cn(
                "flex-1 rounded-xl border py-2 text-xs font-bold",
                amount === v
                  ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                  : "border-white/10 bg-black/30 text-white/60"
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Button className="w-full" disabled={spinning} onClick={() => void spin()}>
          {spinning ? "Spinning…" : `Spin · ৳${amount}`}
        </Button>
      </div>
    </div>
  );
}
