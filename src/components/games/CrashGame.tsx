"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Rocket } from "lucide-react";
import Link from "next/link";

type Hist = { id: string; crashPoint: number | null };

const GROWTH_DEFAULT = 0.23;

function multFromElapsed(ms: number, growth = GROWTH_DEFAULT) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(growth * s) * 100) / 100);
}

export function CrashGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();

  const [amount, setAmount] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2);
  const [useAuto, setUseAuto] = useState(false);
  const [running, setRunning] = useState(false);
  const [display, setDisplay] = useState(1);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    crashPoint: number;
    won: boolean;
    payout: number;
    multiplier: number | null;
    serverSeed?: string;
    serverSeedHash?: string;
  } | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "flying" | "crashed" | "cashed">("idle");

  const startTs = useRef<number>(0);
  const growth = useRef(GROWTH_DEFAULT);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const cashing = useRef(false);
  const autoDone = useRef(false);

  useEffect(() => {
    fetch("/api/games/crash")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setHistory(j.data.history || []);
          if (j.data.growth) growth.current = j.data.growth;
        }
      });
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (poll.current) window.clearInterval(poll.current);
    };
  }, []);

  function stopLoops() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (poll.current) window.clearInterval(poll.current);
    raf.current = null;
    poll.current = null;
  }

  function tickLocal() {
    const loop = () => {
      const m = multFromElapsed(performance.now() - startTs.current, growth.current);
      setDisplay(m);
      // client-side auto cashout trigger
      if (useAuto && !autoDone.current && m >= autoCashout) {
        autoDone.current = true;
        void cashout();
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }

  async function pollStatus(id: string) {
    poll.current = window.setInterval(async () => {
      try {
        const res = await fetch("/api/games/crash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "status", roundId: id }),
        });
        const json = await res.json();
        if (!json.ok) return;
        const d = json.data;
        if (typeof d.current === "number") setDisplay(d.current);
        if (d.status === "completed" || d.crashed || d.cashedOut) {
          stopLoops();
          setRunning(false);
          setRoundId(null);
          if (d.cashedOut) {
            setPhase("cashed");
            setResult({
              crashPoint: d.crashPoint || d.current,
              won: true,
              payout: d.payout,
              multiplier: d.current,
              serverSeed: d.serverSeed,
              serverSeedHash: d.serverSeedHash,
            });
            setBalance(d.balance);
          } else {
            setPhase("crashed");
            setDisplay(d.crashPoint || d.current);
            setResult({
              crashPoint: d.crashPoint || d.current,
              won: false,
              payout: 0,
              multiplier: null,
              serverSeed: d.serverSeed,
              serverSeedHash: d.serverSeedHash,
            });
            setBalance(d.balance);
            toast.error(t("Flew away!", "উড়ে গেছে!"), `${(d.crashPoint || d.current).toFixed(2)}x`);
          }
          if (d.crashPoint) {
            setHistory((h) => [{ id, crashPoint: d.crashPoint }, ...h].slice(0, 30));
          }
        }
      } catch {
        /* ignore transient */
      }
    }, 280);
  }

  async function play() {
    if (!user || running) return;
    setError("");
    setResult(null);
    setPhase("flying");
    setRunning(true);
    setDisplay(1);
    cashing.current = false;
    autoDone.current = false;
    stopLoops();

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
        setPhase("idle");
        toast.error(t("Bet failed", "বেট ব্যর্থ"), json.error);
        return;
      }
      const d = json.data;
      setBalance(d.balance);

      // auto mode resolved server-side
      if (d.mode === "auto") {
        setRunning(false);
        setPhase(d.won ? "cashed" : "crashed");
        setDisplay(d.multiplier || d.crashPoint);
        setResult({
          crashPoint: d.crashPoint,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        setHistory((h) => [{ id: d.roundId, crashPoint: d.crashPoint }, ...h].slice(0, 30));
        if (d.won) toast.success(t("Cashed out!", "ক্যাশ আউট!"), `+${formatCoins(d.payout)} TC @ ${d.multiplier}x`);
        else toast.error(t("Flew away!", "উড়ে গেছে!"));
        return;
      }

      if (d.growth) growth.current = d.growth;
      setRoundId(d.roundId);
      startTs.current = performance.now();
      tickLocal();
      pollStatus(d.roundId);
      toast.info(t("Round started", "রাউন্ড শুরু"), t("Cash out anytime", "যখন খুশি ক্যাশ আউট করুন"));
    } catch {
      setError("Network error");
      setRunning(false);
      setPhase("idle");
    }
  }

  async function cashout() {
    if (!roundId || cashing.current || !running) return;
    cashing.current = true;
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cashout", roundId }),
      });
      const json = await res.json();
      stopLoops();
      setRunning(false);
      setRoundId(null);
      if (!json.ok) {
        setError(json.error || "Cashout failed");
        toast.error(t("Cashout failed", "ক্যাশআউট ব্যর্থ"), json.error);
        setPhase("idle");
        return;
      }
      const d = json.data;
      setBalance(d.balance);
      if (d.crashed) {
        setPhase("crashed");
        setDisplay(d.crashPoint);
        setResult({
          crashPoint: d.crashPoint,
          won: false,
          payout: 0,
          multiplier: null,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        toast.error(t("Flew away!", "উড়ে গেছে!"), `${d.crashPoint.toFixed(2)}x`);
      } else {
        setPhase("cashed");
        setDisplay(d.multiplier);
        setResult({
          crashPoint: d.crashPoint,
          won: true,
          payout: d.payout,
          multiplier: d.multiplier,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        toast.success(
          t("Cashed out!", "ক্যাশ আউট!"),
          `+${formatCoins(d.payout)} TC @ ${Number(d.multiplier).toFixed(2)}x`
        );
      }
      setHistory((h) => [{ id: d.roundId || roundId, crashPoint: d.crashPoint }, ...h].slice(0, 30));
    } catch {
      toast.error("Network error");
    } finally {
      cashing.current = false;
    }
  }

  if (!user) {
    return (
      <div className="premium-card text-center space-y-3">
        <p>{t("Login to play Crash", "ক্র্যাশ খেলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button variant="gold">{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  const color =
    phase === "crashed"
      ? "text-rose-400"
      : phase === "cashed"
        ? "text-emerald-400"
        : running
          ? "text-white"
          : "text-emerald-100";

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <AnimatePresence initial={false}>
          {history.map((h) => (
            <motion.span
              key={h.id}
              initial={{ opacity: 0, x: -8, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold",
                (h.crashPoint || 0) >= 2 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              )}
            >
              {(h.crashPoint || 0).toFixed(2)}x
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-rose-900/40 bg-gradient-to-b from-black via-[#1a0530] to-rose-950 min-h-[300px] flex flex-col items-center justify-center shadow-2xl">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `conic-gradient(from 210deg at 0% 100%, #e11d48 0%, transparent 40%)`,
          }}
        />
        {/* flight path */}
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M0,100 Q ${Math.min(90, (display - 1) * 12)},${Math.max(5, 100 - (display - 1) * 18)} 100,${Math.max(2, 40 - (display - 1) * 3)}`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
        </svg>
        <div
          className="absolute transition-transform duration-75"
          style={{
            left: `${Math.min(78, 8 + (display - 1) * 10)}%`,
            top: `${Math.max(8, 62 - (display - 1) * 8)}%`,
          }}
        >
          <div
            className="absolute inset-0 -z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/25 blur-xl"
            style={{ opacity: running ? 1 : 0 }}
          />
          <Rocket
            className="h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-gold-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]"
            style={{ transform: `rotate(${45 + Math.min(28, (display - 1) * 4)}deg)` }}
            strokeWidth={1.75}
          />
        </div>

        <motion.div
          key={phase}
          initial={{ scale: phase === "idle" ? 1 : 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={cn("relative z-10 text-6xl font-black tracking-tight tabular-nums drop-shadow-lg", color)}
        >
          {display.toFixed(2)}x
        </motion.div>
        <div className="relative z-10 mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          {phase === "flying" && t("Flying — cash out anytime", "উড়ছে — যেকোনো সময় ক্যাশ আউট")}
          {phase === "crashed" && t("Crashed", "ক্র্যাশড")}
          {phase === "cashed" && t("Cashed out", "ক্যাশ আউট")}
          {phase === "idle" && t("Place your bet", "বেট করুন")}
        </div>

        {result && phase !== "flying" && (
          <div className="relative z-10 mt-3 text-sm font-bold">
            {result.won
              ? `+${formatCoins(result.payout)} TC @ ${result.multiplier?.toFixed(2)}x`
              : `${t("Crashed at", "ক্র্যাশ")} ${result.crashPoint.toFixed(2)}x`}
          </div>
        )}
      </div>

      {running && (
        <Button
          size="lg"
          className="w-full text-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-gold"
          onClick={cashout}
        >
          {t("CASH OUT", "ক্যাশ আউট")} {display.toFixed(2)}x · {formatCoins(amount * display)} TC
        </Button>
      )}

      <div className="flex items-center gap-3 rounded-xl bg-surface-900 border border-emerald-800 px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-emerald-100">
          <input type="checkbox" checked={useAuto} onChange={(e) => setUseAuto(e.target.checked)} disabled={running} />
          {t("Auto cashout", "অটো ক্যাশআউট")}
        </label>
        <input
          type="number"
          step="0.1"
          min={1.01}
          value={autoCashout}
          onChange={(e) => setAutoCashout(Number(e.target.value) || 1.01)}
          disabled={!useAuto || running}
          className="w-24 rounded-lg bg-black/40 border border-emerald-700 px-2 py-1 text-sm text-white"
        />
        <span className="text-xs text-emerald-300">x</span>
      </div>

      {!running && (
        <BetControls
          amount={amount}
          setAmount={setAmount}
          onBet={play}
          disabled={running}
          label={t("Bet", "বেট")}
        />
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {result?.serverSeed && (
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
