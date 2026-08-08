"use client";

import { useEffect, useRef, useState } from "react";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Hist = { id: string; crashPoint: number | null };

export function CrashGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);

  const [amount, setAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [useAuto, setUseAuto] = useState(true);
  const [running, setRunning] = useState(false);
  const [display, setDisplay] = useState(1);
  const [result, setResult] = useState<{
    crashPoint: number;
    won: boolean;
    payout: number;
    multiplier: number | null;
    serverSeed: string;
    serverSeedHash: string;
  } | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [error, setError] = useState("");
  const raf = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/games/crash")
      .then((r) => r.json())
      .then((j) => j.ok && setHistory(j.data.history || []));
  }, []);

  function animateTo(target: number, won: boolean, onDone: () => void) {
    const start = performance.now();
    const duration = Math.min(8000, 900 + Math.log(target) * 1400);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out exponential-ish growth
      const mult = 1 + (target - 1) * (1 - Math.pow(1 - p, 2.2));
      setDisplay(Math.floor(mult * 100) / 100);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        setDisplay(target);
        onDone();
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function play() {
    if (!user) return;
    setError("");
    setResult(null);
    setRunning(true);
    setDisplay(1);
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount,
          autoCashout: useAuto ? autoCashout : undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setRunning(false);
        return;
      }
      const d = json.data;
      setBalance(d.balance);
      animateTo(d.crashPoint, d.won, () => {
        setResult({
          crashPoint: d.crashPoint,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        setHistory((h) => [
          { id: d.roundId, crashPoint: d.crashPoint },
          ...h,
        ].slice(0, 20));
        setRunning(false);
      });
    } catch {
      setError("Network error");
      setRunning(false);
    }
  }

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  if (!user) {
    return (
      <div className="rounded-2xl border border-emerald-800 p-6 text-center space-y-3">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  const crashed = result && !running;
  const color = crashed
    ? result.won
      ? "text-emerald-400"
      : "text-rose-400"
    : running
      ? "text-white"
      : "text-emerald-100";

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {history.map((h) => (
          <span
            key={h.id}
            className={
              (h.crashPoint || 0) >= 2
                ? "text-emerald-400 text-xs font-bold shrink-0"
                : "text-rose-400 text-xs font-bold shrink-0"
            }
          >
            {(h.crashPoint || 0).toFixed(2)}x
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-rose-900/50 bg-gradient-to-b from-black via-purple-950/40 to-rose-950 min-h-[260px] flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `conic-gradient(from 200deg at 0% 100%, #e11d48 0%, transparent 35%)`,
          }}
        />
        <div
          className="absolute transition-transform duration-100"
          style={{
            right: running ? `${Math.min(70, (display - 1) * 8)}%` : "12%",
            top: running ? `${Math.max(10, 55 - (display - 1) * 6)}%` : "28%",
            fontSize: 42,
            transform: `rotate(${Math.min(25, (display - 1) * 3)}deg)`,
          }}
        >
          ✈️
        </div>
        <div className={`relative z-10 text-6xl font-black tracking-tight ${color}`}>
          {display.toFixed(2)}x
        </div>
        {crashed && (
          <div className="relative z-10 mt-2 text-sm font-semibold">
            {result.won
              ? `+${formatCoins(result.payout)} TC @ ${result.multiplier?.toFixed(2)}x`
              : t("Flew away!", "উড়ে গেছে!")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-surface-900 border border-emerald-800 px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-emerald-100">
          <input
            type="checkbox"
            checked={useAuto}
            onChange={(e) => setUseAuto(e.target.checked)}
          />
          {t("Auto cashout", "অটো ক্যাশআউট")}
        </label>
        <input
          type="number"
          step="0.1"
          min={1.01}
          value={autoCashout}
          onChange={(e) => setAutoCashout(Number(e.target.value) || 1.01)}
          disabled={!useAuto}
          className="w-24 rounded-lg bg-black/40 border border-emerald-700 px-2 py-1 text-sm text-white"
        />
        <span className="text-xs text-emerald-300">x</span>
      </div>

      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={running}
        label={running ? t("Flying…", "উড়ছে…") : t("Bet", "বেট")}
      />

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {result && (
        <details className="rounded-xl bg-black/30 border border-emerald-900 p-3 text-xs text-emerald-200/80">
          <summary className="cursor-pointer font-semibold text-emerald-100">
            {t("Provably fair", "প্রুভেবলি ফেয়ার")}
          </summary>
          <div className="mt-2 space-y-1 break-all font-mono">
            <div>hash: {result.serverSeedHash}</div>
            <div>seed: {result.serverSeed}</div>
            <div>crash: {result.crashPoint}x</div>
          </div>
        </details>
      )}
    </div>
  );
}
