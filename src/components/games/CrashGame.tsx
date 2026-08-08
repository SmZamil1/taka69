"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Plane } from "lucide-react";
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
  const [countdown, setCountdown] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 5000, maxWin: 50000, maxMultiplier: 100 });

  const startTs = useRef(0);
  const growth = useRef(GROWTH_DEFAULT);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const cashing = useRef(false);
  const autoDone = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    fetch("/api/games/crash")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setHistory(j.data.history || []);
          if (j.data.limits) setLimits(j.data.limits);
        }
      })
      .catch(() => {});
    return () => stopLoops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopLoops() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (poll.current) window.clearInterval(poll.current);
    raf.current = null;
    poll.current = null;
  }

  function drawFlight(mult: number, crashed: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = (h / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // curve progress based on mult
    const tNorm = Math.min(1, Math.log(mult) / Math.log(Math.max(2, limits.maxMultiplier * 0.3)));
    const x = 24 + tNorm * (w - 56);
    const y = h - 28 - tNorm * (h - 70) * (0.55 + Math.min(0.45, (mult - 1) / 20));

    pathRef.current.push({ x, y });
    if (pathRef.current.length > 180) pathRef.current.shift();

    // filled area under curve
    if (pathRef.current.length > 1) {
      const grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, "rgba(244,63,94,0.05)");
      grad.addColorStop(1, "rgba(244,63,94,0.35)");
      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, h - 20);
      for (const p of pathRef.current) ctx.lineTo(p.x, p.y);
      ctx.lineTo(pathRef.current[pathRef.current.length - 1].x, h - 20);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
      for (const p of pathRef.current) ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = crashed ? "#fb7185" : "#f43f5e";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // plane glow
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = crashed ? "rgba(251,113,133,0.25)" : "rgba(251,191,36,0.3)";
    ctx.fill();
  }

  function tickLocal() {
    const loop = () => {
      const m = multFromElapsed(performance.now() - startTs.current, growth.current);
      setDisplay(m);
      drawFlight(m, false);
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
        if (typeof d.current === "number") {
          setDisplay(d.current);
          drawFlight(d.current, !!d.crashed);
        }
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
            drawFlight(d.crashPoint || d.current, true);
            setResult({
              crashPoint: d.crashPoint || d.current,
              won: false,
              payout: 0,
              multiplier: null,
              serverSeed: d.serverSeed,
              serverSeedHash: d.serverSeedHash,
            });
            setBalance(d.balance);
            toast.error(t("Flew away", "উড়ে গেছে"), `${(d.crashPoint || d.current).toFixed(2)}x`);
          }
          if (d.crashPoint) {
            setHistory((h) => [{ id, crashPoint: d.crashPoint }, ...h].slice(0, 30));
          }
        }
      } catch {
        /* ignore */
      }
    }, 250);
  }

  async function play() {
    if (!user || running) return;
    setError("");
    setResult(null);
    pathRef.current = [];
    setPhase("idle");
    setCountdown(3);
    // short Aviator-like countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 350));
    }
    setCountdown(0);
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
      if (d.limits) setLimits(d.limits);

      if (d.mode === "auto") {
        setRunning(false);
        setPhase(d.won ? "cashed" : "crashed");
        setDisplay(d.multiplier || d.crashPoint);
        drawFlight(d.multiplier || d.crashPoint, !d.won);
        setResult({
          crashPoint: d.crashPoint,
          won: d.won,
          payout: d.payout,
          multiplier: d.multiplier,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        setHistory((h) => [{ id: d.roundId, crashPoint: d.crashPoint }, ...h].slice(0, 30));
        if (d.won) toast.success(t("Cashed out", "ক্যাশ আউট"), `+${formatCoins(d.payout)} TK @ ${d.multiplier}x`);
        else toast.error(t("Flew away", "উড়ে গেছে"));
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
        drawFlight(d.crashPoint, true);
        setResult({
          crashPoint: d.crashPoint,
          won: false,
          payout: 0,
          multiplier: null,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        toast.error(t("Flew away", "উড়ে গেছে"), `${d.crashPoint.toFixed(2)}x`);
      } else {
        setPhase("cashed");
        setDisplay(d.multiplier);
        drawFlight(d.multiplier, false);
        setResult({
          crashPoint: d.crashPoint,
          won: true,
          payout: d.payout,
          multiplier: d.multiplier,
          serverSeed: d.serverSeed,
          serverSeedHash: d.serverSeedHash,
        });
        toast.success(
          t("Cashed out", "ক্যাশ আউট"),
          `+${formatCoins(d.payout)} TK @ ${Number(d.multiplier).toFixed(2)}x`
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

  const planeLeft = Math.min(82, 8 + Math.log(Math.max(1, display)) * 18);
  const planeTop = Math.max(10, 68 - Math.log(Math.max(1, display)) * 16);

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

      <div className="relative overflow-hidden rounded-2xl border border-rose-900/40 bg-[#0b0614] min-h-[320px] shadow-2xl">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(244,63,94,0.18),transparent_45%)]" />

        {/* plane marker */}
        {(running || phase === "cashed" || phase === "crashed") && (
          <div
            className="absolute z-10 transition-all duration-75"
            style={{ left: `${planeLeft}%`, top: `${planeTop}%` }}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 rounded-full bg-gold-400/30 blur-md" />
              <Plane
                className={cn(
                  "h-8 w-8 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]",
                  phase === "crashed" ? "text-rose-400 rotate-12" : "text-gold-300 -rotate-12"
                )}
                strokeWidth={1.75}
              />
            </div>
          </div>
        )}

        <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-4 py-8">
          {countdown > 0 ? (
            <div className="text-5xl font-black text-gold-300 animate-pop-in">{countdown}</div>
          ) : (
            <motion.div
              key={phase + display.toFixed(1)}
              initial={{ scale: 0.92, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("text-6xl font-black tracking-tight tabular-nums drop-shadow-lg", color)}
            >
              {display.toFixed(2)}x
            </motion.div>
          )}
          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {phase === "flying" && t("Flying — cash out anytime", "উড়ছে — যেকোনো সময় ক্যাশ আউট")}
            {phase === "crashed" && t("Flew away", "উড়ে গেছে")}
            {phase === "cashed" && t("Cashed out", "ক্যাশ আউট")}
            {phase === "idle" && countdown === 0 && t("Place your bet", "বেট করুন")}
          </div>
          {result && phase !== "flying" && (
            <div className="mt-3 text-sm font-bold">
              {result.won
                ? `+${formatCoins(result.payout)} TK @ ${result.multiplier?.toFixed(2)}x`
                : `${t("Crashed at", "ক্র্যাশ")} ${result.crashPoint.toFixed(2)}x`}
            </div>
          )}
        </div>
      </div>

      {running && (
        <Button
          size="lg"
          className="w-full text-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-gold animate-pulse"
          onClick={cashout}
        >
          {t("CASH OUT", "ক্যাশ আউট")} {display.toFixed(2)}x · {formatCoins(amount * display)} TK
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
          max={limits.maxMultiplier}
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
          min={limits.minBet}
          max={limits.maxBet}
        />
      )}

      <p className="text-[10px] text-emerald-200/45">
        {t("Max win", "সর্বোচ্চ জয়")}: {formatCoins(limits.maxWin)} TK · {t("Max mult", "ম্যাক্স মাল্টি")}: {limits.maxMultiplier}x · {t("Virtual TK only", "শুধু ভার্চুয়াল TK")}
      </p>

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
