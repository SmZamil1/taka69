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
    <div className="rounded-2xl border border-emerald-800/60 bg-surface-900/80 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <button
          className="h-10 w-10 rounded-full bg-emerald-900 text-xl font-bold text-white"
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
          className="flex-1 rounded-xl bg-black/40 border border-emerald-700/40 px-3 py-2 text-center text-lg font-bold text-white outline-none"
        />
        <button
          className="h-10 w-10 rounded-full bg-emerald-900 text-xl font-bold text-white"
          onClick={() => setAmount(Math.min(max, amount + 10))}
        >
          +
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={cn(
              "rounded-lg py-1.5 text-xs font-semibold border",
              amount === p
                ? "bg-gold-500 text-emerald-950 border-gold-400"
                : "bg-emerald-950/60 text-emerald-100 border-emerald-800"
            )}
          >
            {p.toLocaleString()}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full text-lg"
        onClick={onBet}
        disabled={disabled}
      >
        {label || t("Bet", "বেট")} {amount.toFixed(2)} TC
      </Button>
    </div>
  );
}
