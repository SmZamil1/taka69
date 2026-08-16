"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];

/** Cherry Charm — wallet-connected 3-reel slot (assets from cherry-charm package) */
export default function CherryCharmPage() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const toast = useToast();
  const [amount, setAmount] = useState(20);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(["🍒", "🍋", "🔔"]);
  const [lastWin, setLastWin] = useState(0);

  async function spin() {
    if (!user || spinning) return;
    setSpinning(true);
    setLastWin(0);
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
      // animate fake reel shuffle then settle
      let n = 0;
      const id = window.setInterval(() => {
        setReels([
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ]);
        n += 1;
        if (n > 12) {
          window.clearInterval(id);
          // map multiplier to symbol display
          const won = Number(j.data.payout || 0) > 0;
          setReels(
            won
              ? ["7️⃣", "7️⃣", "7️⃣"]
              : [
                  SYMBOLS[Math.floor(Math.random() * 4)],
                  SYMBOLS[Math.floor(Math.random() * 4)],
                  SYMBOLS[Math.floor(Math.random() * 4)],
                ]
          );
          setLastWin(Number(j.data.payout || 0));
          if (typeof j.data.balance === "number") setBalance(j.data.balance);
          setSpinning(false);
          if (j.data.payout > 0) toast.success("Win!", `+${j.data.payout} BDT`);
        }
      }, 70);
    } catch {
      toast.error("Network error");
      setSpinning(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white/70">Login to play Cherry Charm</p>
        <Link href="/login?next=/games/cherry-charm">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gradient-to-b from-rose-950 via-black to-black px-3 pb-10 pt-3 text-white">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/games" className="rounded-full border border-white/10 bg-white/5 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black">Cherry Charm</div>
          <div className="text-[10px] uppercase tracking-wider text-rose-300/70">Wallet slots</div>
        </div>
        <div className="rounded-full border border-amber-400/30 bg-black/40 px-3 py-1.5 text-xs font-black text-amber-300">
          ৳{formatCoins(user.balance)}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-rose-400/20 bg-gradient-to-b from-rose-900/40 to-black p-5 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/games/cherry-charm/images/cherry.png"
          alt=""
          className="mx-auto mb-4 h-16 w-16 object-contain opacity-90"
        />
        <div className="grid grid-cols-3 gap-2">
          {reels.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-black/50 text-4xl shadow-inner",
                spinning && "animate-pulse"
              )}
            >
              {s}
            </div>
          ))}
        </div>
        {lastWin > 0 && (
          <div className="mt-3 text-center text-sm font-black text-emerald-300">
            +{formatCoins(lastWin)} BDT
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="block text-xs text-white/50">
          Bet amount
          <input
            type="number"
            min={10}
            value={amount}
            onChange={(e) => setAmount(Math.max(10, Number(e.target.value) || 10))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-white outline-none"
          />
        </label>
        <div className="flex gap-2">
          {[10, 20, 50, 100].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 py-2 text-xs font-bold text-white/70"
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
