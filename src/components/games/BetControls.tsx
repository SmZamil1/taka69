"use client";

import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

const PRESETS = [10, 50, 100, 500, 1000, 5000];

export function BetControls({
  amount,
  setAmount,
  onBet,
  disabled,
  label,
  min = 1,
  max = 100000,
}: {
  amount: number;
  setAmount: (n: number) => void;
  onBet: () => void;
  disabled?: boolean;
  label?: string;
  min?: number;
  max?: number;
}) {
  const t = useLang((s) => s.t);

  return (
    <div className="space-y-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-card backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-bold text-white active:scale-95"
          onClick={() => setAmount(Math.max(min, amount - 10))}
        >
          −
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(Math.min(max, Math.max(min, Number(e.target.value) || min)))
          }
          className="flex-1 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-center text-lg font-bold text-white outline-none focus:border-emerald-400/40"
        />
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-bold text-white active:scale-95"
          onClick={() => setAmount(Math.min(max, amount + 10))}
        >
          +
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(Math.min(max, Math.max(min, p)))}
            className={cn(
              "rounded-xl py-2 text-xs font-bold border transition active:scale-95",
              amount === p
                ? "bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 border-amber-300"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            )}
          >
            {p.toLocaleString()}
          </button>
        ))}
      </div>

      <Button size="lg" className="w-full text-lg font-black" onClick={onBet} disabled={disabled}>
        {label || t("Bet", "বেট")} {amount.toFixed(0)} TK
      </Button>
    </div>
  );
}
