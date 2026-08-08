"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Plane, Volume2, VolumeX, Music2, Music } from "lucide-react";
import Link from "next/link";
import { sound } from "@/lib/sounds";

type Hist = { id: string; crashPoint: number | null };
type Phase = "idle" | "countdown" | "flying" | "crashed" | "cashed";

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
  const [amount2, setAmount2] = useState(20);
  const [autoCashout, setAutoCashout] = useState(2);
  const [autoCashout2, setAutoCashout2] = useState(5);
  const [useAuto, setUseAuto] = useState(false);
  const [useAuto2, setUseAuto2] = useState(false);
  const [bet2Enabled, setBet2Enabled] = useState(false);
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
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 5000, maxWin: 50000, maxMultiplier: 100 });
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [livePlayers] = useState(() => 120 + Math.floor(Math.random() * 80));

  const startTs = useRef(0);
  const growth = useRef(GROWTH_DEFAULT);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const cashing = useRef(false);
  const autoDone = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const lastFlySfx = useRef(0);

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
    return () => {
      stopLoops();
      sound.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopLoops() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (poll.current) window.clearInterval(poll.current);
    raf.current = null;
    poll.current = null;
  }

  const drawFlight = useCallback((mult: number, crashed: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 10 || h < 10) return;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0a0520");
    bg.addColorStop(0.45, "#1a0a2e");
    bg.addColorStop(1, crashed ? "#3b0a14" : "#12061f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // stars
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % w;
      const sy = (i * 53) % (h * 0.55);
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // grid floor
    ctx.strokeStyle = "rgba(244,63,94,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = h * 0.55 + i * ((h * 0.45) / 10);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = (w / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.55);
      ctx.lineTo(w / 2 + (x - w / 2) * 1.4, h);
      ctx.stroke();
    }

    const tNorm = Math.min(1, Math.log(Math.max(1.001, mult)) / Math.log(Math.max(2, limits.maxMultiplier * 0.25)));
    const x = 28 + tNorm * (w - 70);
    const y = h - 36 - tNorm * (h - 90) * (0.55 + Math.min(0.4, (mult - 1) / 18));

    pathRef.current.push({ x, y });
    if (pathRef.current.length > 220) pathRef.current.shift();

    if (pathRef.current.length > 1) {
      const grad = ctx.createLinearGradient(0, h, x, 0);
      grad.addColorStop(0, "rgba(244,63,94,0.05)");
      grad.addColorStop(1, crashed ? "rgba(251,113,133,0.45)" : "rgba(251,191,36,0.35)");
      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, h - 24);
      for (const p of pathRef.current) ctx.lineTo(p.x, p.y);
      ctx.lineTo(pathRef.current[pathRef.current.length - 1].x, h - 24);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
      for (const p of pathRef.current) ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = crashed ? "#fb7185" : "#f43f5e";
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";
      ctx.shadowColor = crashed ? "#f43f5e" : "#fbbf24";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // plane glow
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = crashed ? "rgba(251,113,133,0.35)" : "rgba(251,191,36,0.35)";
    ctx.fill();
  }, [limits.maxMultiplier]);

  function tickLocal() {
    const loop = () => {
      const m = multFromElapsed(performance.now() - startTs.current, growth.current);
      setDisplay(m);
      drawFlight(m, false);
      const now = performance.now();
      if (now - lastFlySfx.current > 420) {
        sound.flyTick(m);
        lastFlySfx.current = now;
      }
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
            sound.cashout();
            sound.win();
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
            sound.crash();
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
    }, 220);
  }

  async function play(slot: 1 | 2 = 1) {
    if (!user || running) return;
    await sound.unlock();
    if (musicOn && !muted) sound.startMusic();
    const stake = slot === 1 ? amount : amount2;
    const auto = slot === 1 ? (useAuto ? autoCashout : undefined) : useAuto2 ? autoCashout2 : undefined;
    setError("");
    setResult(null);
    pathRef.current = [];
    setPhase("countdown");
    sound.bet();
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      sound.countdown();
      await new Promise((r) => setTimeout(r, 380));
    }
    setCountdown(0);
    setPhase("flying");
    setRunning(true);
    setDisplay(1);
    cashing.current = false;
    autoDone.current = false;
    stopLoops();
    sound.takeoff();

    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: stake, autoCashout: auto }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setRunning(false);
        setPhase("idle");
        sound.lose();
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
        if (d.won) {
          sound.cashout();
          sound.win();
        } else sound.crash();
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
        sound.crash();
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
        sound.cashout();
        sound.win();
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
        toast.success(t("Cashed out", "ক্যাশ আউট"), `+${formatCoins(d.payout)} TK @ ${Number(d.multiplier).toFixed(2)}x`);
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

  const planeLeft = Math.min(84, 10 + Math.log(Math.max(1, display)) * 18);
  const planeTop = Math.max(12, 70 - Math.log(Math.max(1, display)) * 16);

  function BetPanel({
    slot,
    value,
    setValue,
    auto,
    setAuto,
    useA,
    setUseA,
  }: {
    slot: 1 | 2;
    value: number;
    setValue: (n: number) => void;
    auto: number;
    setAuto: (n: number) => void;
    useA: boolean;
    setUseA: (b: boolean) => void;
  }) {
    return (
      <div className="rounded-2xl border border-rose-900/40 bg-black/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-rose-200/70">
          <span>{t("Bet", "বেট")} {slot}</span>
          <span className="text-emerald-300/70">{livePlayers + slot * 3} {t("online", "অনলাইন")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-9 w-9 rounded-lg bg-rose-950 text-lg font-bold"
            onClick={() => {
              sound.click();
              setValue(Math.max(limits.minBet, value - 10));
            }}
          >
            −
          </button>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Math.min(limits.maxBet, Math.max(limits.minBet, Number(e.target.value) || limits.minBet)))}
            className="flex-1 rounded-xl border border-rose-900/50 bg-black/50 px-2 py-2 text-center text-lg font-black text-white"
          />
          <button
            className="h-9 w-9 rounded-lg bg-rose-950 text-lg font-bold"
            onClick={() => {
              sound.click();
              setValue(Math.min(limits.maxBet, value + 10));
            }}
          >
            +
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[10, 50, 100, 500].map((p) => (
            <button
              key={p}
              onClick={() => {
                sound.click();
                setValue(p);
              }}
              className={cn(
                "rounded-md py-1 text-[10px] font-bold border",
                value === p ? "bg-gold-500 text-emerald-950 border-gold-400" : "border-rose-900/40 text-rose-100"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-rose-100/80">
          <input type="checkbox" checked={useA} onChange={(e) => setUseA(e.target.checked)} disabled={running} />
          {t("Auto", "অটো")}
          <input
            type="number"
            step="0.1"
            min={1.01}
            value={auto}
            disabled={!useA || running}
            onChange={(e) => setAuto(Number(e.target.value) || 1.01)}
            className="ml-auto w-16 rounded-md border border-rose-900/40 bg-black/40 px-1 py-0.5 text-xs"
          />
          x
        </label>
        {!running ? (
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black"
            onClick={() => play(slot)}
          >
            {t("BET", "বেট")} {formatCoins(value)} TK
          </Button>
        ) : slot === 1 ? (
          <Button
            className="w-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black animate-pulse"
            onClick={cashout}
          >
            {t("CASH OUT", "ক্যাশ আউট")} {display.toFixed(2)}x
          </Button>
        ) : (
          <div className="rounded-xl bg-black/30 py-2 text-center text-xs text-rose-200/60">
            {t("Waiting…", "অপেক্ষা…")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* top bar: history + sound */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <AnimatePresence initial={false}>
            {history.map((h) => (
              <motion.span
                key={h.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black",
                  (h.crashPoint || 0) >= 2
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                )}
              >
                {(h.crashPoint || 0).toFixed(2)}x
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <button
          onClick={() => {
            sound.unlock();
            const next = !musicOn;
            setMusicOn(next);
            sound.musicOn = next;
            if (next && !muted) sound.startMusic();
            else sound.stopMusic();
            sound.click();
          }}
          className="rounded-xl border border-rose-900/40 bg-black/40 p-2 text-rose-100"
          aria-label="Music"
        >
          {musicOn ? <Music2 className="h-4 w-4" /> : <Music className="h-4 w-4 opacity-40" />}
        </button>
        <button
          onClick={() => {
            sound.unlock();
            const m = sound.toggleMute();
            setMuted(m);
          }}
          className="rounded-xl border border-rose-900/40 bg-black/40 p-2 text-rose-100"
          aria-label="Mute"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* stage */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-900/50 bg-[#0b0614] min-h-[340px] shadow-2xl">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {(running || phase === "cashed" || phase === "crashed") && (
          <div
            className="absolute z-10 transition-all duration-75"
            style={{ left: `${planeLeft}%`, top: `${planeTop}%` }}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 rounded-full bg-gold-400/40 blur-md" />
              <Plane
                className={cn(
                  "h-9 w-9 drop-shadow-[0_0_14px_rgba(251,191,36,0.95)]",
                  phase === "crashed" ? "text-rose-400 rotate-45" : "text-gold-300 -rotate-[20deg]"
                )}
                strokeWidth={1.75}
              />
            </div>
          </div>
        )}

        <div className="relative z-10 flex min-h-[340px] flex-col items-center justify-center px-4 py-8">
          {phase === "countdown" && countdown > 0 ? (
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-gold-300/80 mb-2">
                {t("Next round", "পরের রাউন্ড")}
              </div>
              <div className="text-7xl font-black text-gold-300 animate-pop-in">{countdown}</div>
            </div>
          ) : (
            <>
              <motion.div
                key={phase + Math.floor(display * 10)}
                initial={{ scale: 0.94, opacity: 0.75 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("text-6xl sm:text-7xl font-black tracking-tight tabular-nums drop-shadow-lg", color)}
              >
                {display.toFixed(2)}x
              </motion.div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                {phase === "flying" && t("Flying — cash out anytime", "উড়ছে — যেকোনো সময় ক্যাশ আউট")}
                {phase === "crashed" && t("Flew away", "উড়ে গেছে")}
                {phase === "cashed" && t("Cashed out", "ক্যাশ আউট")}
                {phase === "idle" && t("Place your bet", "বেট করুন")}
              </div>
              {result && phase !== "flying" && phase !== "countdown" && (
                <div className="mt-3 text-sm font-bold">
                  {result.won
                    ? `+${formatCoins(result.payout)} TK @ ${result.multiplier?.toFixed(2)}x`
                    : `${t("Crashed at", "ক্র্যাশ")} ${result.crashPoint.toFixed(2)}x`}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* dual bet panels like Aviator */}
      <div className={cn("grid gap-2", bet2Enabled ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        <BetPanel
          slot={1}
          value={amount}
          setValue={setAmount}
          auto={autoCashout}
          setAuto={setAutoCashout}
          useA={useAuto}
          setUseA={setUseAuto}
        />
        {bet2Enabled && (
          <BetPanel
            slot={2}
            value={amount2}
            setValue={setAmount2}
            auto={autoCashout2}
            setAuto={setAutoCashout2}
            useA={useAuto2}
            setUseA={setUseAuto2}
          />
        )}
      </div>
      {!bet2Enabled && (
        <button
          onClick={() => {
            sound.click();
            setBet2Enabled(true);
          }}
          className="w-full rounded-xl border border-dashed border-rose-800/50 py-2 text-xs font-semibold text-rose-200/70"
        >
          + {t("Add second bet", "দ্বিতীয় বেট যোগ করুন")}
        </button>
      )}

      <p className="text-[10px] text-center text-emerald-200/40">
        {t("Max win", "সর্বোচ্চ জয়")}: {formatCoins(limits.maxWin)} TK · {t("Max mult", "ম্যাক্স মাল্টি")}:{" "}
        {limits.maxMultiplier}x · {t("Virtual TK only", "শুধু ভার্চুয়াল TK")}
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
