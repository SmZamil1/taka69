"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Volume2, VolumeX, Music2, Music, Plus, Minus, Users } from "lucide-react";
import Link from "next/link";
import { sound } from "@/lib/sounds";

type Hist = { id: string; crashPoint: number | null };
type Phase = "idle" | "countdown" | "flying" | "crashed" | "cashed";

const GROWTH_DEFAULT = 0.23;
const PLANE_SRC = "/aviator/img/rocket5.gif";
const BG_SRC = "/aviator/img/bg-image.gif";

function multFromElapsed(ms: number, growth = GROWTH_DEFAULT) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(growth * s) * 100) / 100);
}

type BetPanel = {
  amount: number;
  auto: number;
  useAuto: boolean;
  placed: boolean;
  cashed: boolean;
  payout: number;
  cashMult: number | null;
};

const emptyBet = (amount: number): BetPanel => ({
  amount,
  auto: 2,
  useAuto: false,
  placed: false,
  cashed: false,
  payout: 0,
  cashMult: null,
});

export function CrashGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();

  const [bet1, setBet1] = useState<BetPanel>(() => emptyBet(10));
  const [bet2, setBet2] = useState<BetPanel>(() => emptyBet(20));
  const [bet2On, setBet2On] = useState(true);
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
  const [limits, setLimits] = useState({
    minBet: 10,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 100,
  });
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [livePlayers] = useState(() => 140 + Math.floor(Math.random() * 90));
  const [fakeBets, setFakeBets] = useState<{ name: string; amt: number }[]>([]);

  const startWall = useRef(0);
  const growth = useRef(GROWTH_DEFAULT);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const cashing = useRef(false);
  const autoDone1 = useRef(false);
  const autoDone2 = useRef(false);
  const finished = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeRef = useRef<HTMLImageElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const spaceRef = useRef<HTMLDivElement | null>(null);
  const displayRef = useRef(1);
  const bet1Ref = useRef(bet1);
  const bet2Ref = useRef(bet2);
  const bet2OnRef = useRef(bet2On);
  const roundIdRef = useRef<string | null>(null);
  const lastFlySfx = useRef(0);

  useEffect(() => {
    bet1Ref.current = bet1;
  }, [bet1]);
  useEffect(() => {
    bet2Ref.current = bet2;
  }, [bet2]);
  useEffect(() => {
    bet2OnRef.current = bet2On;
  }, [bet2On]);
  useEffect(() => {
    roundIdRef.current = roundId;
  }, [roundId]);
  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    fetch("/api/games/crash")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setHistory(j.data.history || []);
          if (j.data.limits) setLimits(j.data.limits);
          if (j.data.growth) growth.current = j.data.growth;
        }
      })
      .catch(() => {});
    return () => {
      stopLoops();
      sound.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = spaceRef.current;
    if (!el) return;
    el.querySelectorAll(".av-star").forEach((n) => n.remove());
    for (let i = 0; i < 40; i++) {
      const star = document.createElement("div");
      star.className = "av-star";
      const size = Math.random() * 2 + 0.5;
      star.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-${size}px;background:#fff;border-radius:50%;opacity:${0.4 + Math.random() * 0.6};animation:avZoom ${3.5 + Math.random() * 5}s linear ${Math.random() * 7}s infinite;pointer-events:none;`;
      el.appendChild(star);
    }
  }, []);

  function stopLoops() {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (poll.current) window.clearInterval(poll.current);
    raf.current = null;
    poll.current = null;
  }

  const placePlane = useCallback((mult: number, crashed: boolean) => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || canvas.clientWidth || 300;
    const h = parent?.clientHeight || canvas.clientHeight || 240;
    const progress = Math.min(1, Math.log(Math.max(1.0001, mult)) / Math.log(50));
    const pad = 30;
    const x = pad + (w - pad * 2) * Math.min(0.92, progress);
    const y = h - pad - (h - pad * 2) * Math.min(0.88, Math.pow(progress, 0.9));
    const rot = -10 - progress * 30;

    pathRef.current.push({ x, y });
    if (pathRef.current.length > 140) pathRef.current.shift();

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const path = pathRef.current;
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        const grad = ctx.createLinearGradient(path[0].x, path[0].y, x, y);
        grad.addColorStop(0, "rgba(255,40,80,0)");
        grad.addColorStop(0.45, "rgba(255,50,90,0.5)");
        grad.addColorStop(1, "rgba(255,90,130,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.lineTo(x, h);
        ctx.lineTo(path[0].x, h);
        ctx.closePath();
        const fill = ctx.createLinearGradient(0, 0, 0, h);
        fill.addColorStop(0, "rgba(255,40,80,0.28)");
        fill.addColorStop(1, "rgba(255,40,80,0)");
        ctx.fillStyle = fill;
        ctx.fill();
      }
    }

    if (plane) {
      plane.style.opacity = crashed ? "0" : "1";
      plane.style.transform = `translate(${x - 42}px, ${y - 30}px) rotate(${rot}deg)`;
    }
  }, []);

  const endRound = useCallback(
    (payload: {
      crashPoint: number;
      payout: number;
      won: boolean;
      multiplier: number | null;
      serverSeed?: string;
      serverSeedHash?: string;
      id: string;
    }) => {
      if (finished.current) return;
      finished.current = true;
      stopLoops();
      sound.stopMusic();
      setRunning(false);
      setDisplay(payload.crashPoint);
      placePlane(payload.crashPoint, true);
      setPhase(payload.won ? "cashed" : "crashed");
      setResult({
        crashPoint: payload.crashPoint,
        won: payload.won,
        payout: payload.payout,
        multiplier: payload.multiplier,
        serverSeed: payload.serverSeed,
        serverSeedHash: payload.serverSeedHash,
      });
      setHistory((h) =>
        [{ id: payload.id, crashPoint: payload.crashPoint }, ...h].slice(0, 30)
      );
      if (!payload.won) sound.lose();
      setTimeout(() => {
        setBet1((b) => ({ ...emptyBet(b.amount), auto: b.auto, useAuto: b.useAuto }));
        setBet2((b) => ({ ...emptyBet(b.amount), auto: b.auto, useAuto: b.useAuto }));
        setRoundId(null);
        setPhase("idle");
      }, 2800);
    },
    [placePlane]
  );

  async function doCashout(which: 1 | 2) {
    const id = roundIdRef.current;
    if (!id || cashing.current || finished.current) return;
    const b = which === 1 ? bet1Ref.current : bet2Ref.current;
    if (!b.placed || b.cashed) return;
    cashing.current = true;
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cashout", roundId: id }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (json.data?.crashed) {
          sound.crash();
          endRound({
            crashPoint: json.data.crashPoint || displayRef.current,
            payout: 0,
            won: false,
            multiplier: null,
            serverSeed: json.data.serverSeed,
            serverSeedHash: json.data.serverSeedHash,
            id,
          });
        }
        cashing.current = false;
        return;
      }
      sound.cashout();
      setBalance(json.data.balance);
      const mult = json.data.multiplier as number;
      const payout = json.data.payout as number;
      if (which === 1) {
        setBet1((x) => ({ ...x, cashed: true, payout, cashMult: mult }));
        autoDone1.current = true;
        bet1Ref.current = { ...bet1Ref.current, cashed: true, payout, cashMult: mult };
      } else {
        setBet2((x) => ({ ...x, cashed: true, payout, cashMult: mult }));
        autoDone2.current = true;
        bet2Ref.current = { ...bet2Ref.current, cashed: true, payout, cashMult: mult };
      }
      toast.success(t("Cashed out!", "ক্যাশআউট!"), `${mult}x · +${formatCoins(payout)} TK`);

      // Server only supports one cashout per round — end after successful cashout
      endRound({
        crashPoint: json.data.crashPoint || mult,
        payout,
        won: true,
        multiplier: mult,
        serverSeed: json.data.serverSeed,
        serverSeedHash: json.data.serverSeedHash,
        id,
      });
      setPhase("cashed");
    } catch {
      /* */
    }
    cashing.current = false;
  }

  function startLoops(id: string, serverStartedAt?: string) {
    finished.current = false;
    startWall.current = serverStartedAt ? new Date(serverStartedAt).getTime() : Date.now();
    pathRef.current = [];
    autoDone1.current = false;
    autoDone2.current = false;

    const tick = () => {
      if (finished.current) return;
      const elapsed = Date.now() - startWall.current;
      const m = multFromElapsed(elapsed, growth.current);
      setDisplay(m);
      displayRef.current = m;
      placePlane(m, false);

      const now = performance.now();
      if (now - lastFlySfx.current > 220) {
        sound.flyTick(m);
        lastFlySfx.current = now;
      }

      const b1 = bet1Ref.current;
      const b2 = bet2Ref.current;
      if (b1.placed && b1.useAuto && !autoDone1.current && !b1.cashed && m >= b1.auto) {
        autoDone1.current = true;
        void doCashout(1);
      }
      if (
        bet2OnRef.current &&
        b2.placed &&
        b2.useAuto &&
        !autoDone2.current &&
        !b2.cashed &&
        m >= b2.auto
      ) {
        // second panel auto is cosmetic if primary already cashed; try cashout if still open
        autoDone2.current = true;
        if (!b1.cashed) void doCashout(1);
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    poll.current = window.setInterval(async () => {
      if (finished.current) return;
      try {
        const res = await fetch("/api/games/crash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "status", roundId: id }),
        });
        const json = await res.json();
        if (!json.ok) return;
        if (typeof json.data.current === "number") {
          setDisplay(json.data.current);
          displayRef.current = json.data.current;
          placePlane(json.data.current, !!json.data.crashed);
        }
        if (json.data.balance != null) setBalance(json.data.balance);
        if (json.data.crashed || json.data.status === "completed") {
          const cp = json.data.crashPoint || json.data.current || displayRef.current;
          const b1 = bet1Ref.current;
          const payout = b1.cashed ? b1.payout : json.data.payout || 0;
          const won = payout > 0 || !!json.data.cashedOut;
          if (!won) sound.crash();
          endRound({
            crashPoint: cp,
            payout,
            won,
            multiplier: b1.cashMult || (won ? json.data.current : null),
            serverSeed: json.data.serverSeed,
            serverSeedHash: json.data.serverSeedHash,
            id,
          });
        }
      } catch {
        /* */
      }
    }, 400);
  }

  async function startRound() {
    if (!user || running) return;
    await sound.unlock();
    sound.bet();
    setError("");
    setResult(null);
    setRunning(true);
    setPhase("countdown");
    setDisplay(1);
    pathRef.current = [];
    placePlane(1, false);
    finished.current = false;

    const names = ["Rafi", "Nila", "Karim", "Mitu", "Sakib", "Ayesha", "Joy", "Tania", "Hasan", "Rima"];
    setFakeBets(
      Array.from({ length: 10 }, () => ({
        name: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 90),
        amt: [10, 20, 50, 100, 200, 500][Math.floor(Math.random() * 6)],
      }))
    );

    for (let c = 5; c >= 1; c--) {
      setCountdown(c);
      sound.countdown();
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(0);

    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: bet1.amount,
          autoCashout: bet1.useAuto ? bet1.auto : undefined,
        }),
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

      // Auto mode resolves instantly on server
      if (json.data.mode === "auto") {
        setBalance(json.data.balance);
        setPhase(json.data.won ? "cashed" : "crashed");
        setDisplay(json.data.crashPoint);
        placePlane(json.data.crashPoint, !json.data.won);
        if (json.data.won) sound.cashout();
        else sound.crash();
        setResult({
          crashPoint: json.data.crashPoint,
          won: json.data.won,
          payout: json.data.payout,
          multiplier: json.data.multiplier,
          serverSeed: json.data.serverSeed,
          serverSeedHash: json.data.serverSeedHash,
        });
        setHistory((h) =>
          [{ id: json.data.roundId, crashPoint: json.data.crashPoint }, ...h].slice(0, 30)
        );
        setRunning(false);
        setTimeout(() => setPhase("idle"), 2500);
        return;
      }

      setBalance(json.data.balance);
      setRoundId(json.data.roundId);
      roundIdRef.current = json.data.roundId;
      if (json.data.growth) growth.current = json.data.growth;
      if (json.data.limits) setLimits(json.data.limits);
      setBet1((b) => ({ ...b, placed: true, cashed: false, payout: 0, cashMult: null }));
      if (bet2On) {
        setBet2((b) => ({ ...b, placed: true, cashed: false, payout: 0, cashMult: null }));
      }
      setPhase("flying");
      sound.takeoff();
      if (musicOn && !muted) sound.startMusic();
      startLoops(json.data.roundId, json.data.startedAt);
    } catch {
      setError("Network error");
      setRunning(false);
      setPhase("idle");
    }
  }

  function histColor(cp: number | null) {
    if (!cp) return "bg-white/10 text-white/60";
    if (cp < 2) return "bg-rose-500/20 text-rose-300";
    if (cp < 5) return "bg-amber-500/20 text-amber-200";
    return "bg-emerald-500/25 text-emerald-300";
  }

  function BetCard({
    label,
    bet,
    setBet,
    which,
  }: {
    label: string;
    bet: BetPanel;
    setBet: React.Dispatch<React.SetStateAction<BetPanel>>;
    which: 1 | 2;
  }) {
    const canCash = phase === "flying" && bet.placed && !bet.cashed && !!roundId && which === 1;
    const waiting = phase === "countdown";
    return (
      <div className="rounded-2xl border border-white/10 bg-[#1a1c22]/95 p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/50">
          <span>{label}</span>
          {bet.cashed && (
            <span className="text-emerald-400">
              {bet.cashMult?.toFixed(2)}x · +{formatCoins(bet.payout)}
            </span>
          )}
        </div>
        <div className="mb-2 flex gap-1 rounded-xl bg-black/40 p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-bold",
              !bet.useAuto ? "bg-white/10 text-white" : "text-white/40"
            )}
            onClick={() => setBet((b) => ({ ...b, useAuto: false }))}
            disabled={running}
          >
            {t("Manual", "ম্যানুয়াল")}
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-bold",
              bet.useAuto ? "bg-white/10 text-white" : "text-white/40"
            )}
            onClick={() => setBet((b) => ({ ...b, useAuto: true }))}
            disabled={running}
          >
            {t("Auto", "অটো")}
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10"
            disabled={running}
            onClick={() =>
              setBet((b) => ({
                ...b,
                amount: Math.max(limits.minBet, Math.floor(b.amount - 10)),
              }))
            }
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-center text-sm font-bold text-white outline-none focus:border-rose-400/50"
            value={bet.amount}
            disabled={running}
            min={limits.minBet}
            max={limits.maxBet}
            onChange={(e) =>
              setBet((b) => ({
                ...b,
                amount: Math.min(
                  limits.maxBet,
                  Math.max(limits.minBet, Number(e.target.value) || limits.minBet)
                ),
              }))
            }
          />
          <button
            type="button"
            className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10"
            disabled={running}
            onClick={() =>
              setBet((b) => ({
                ...b,
                amount: Math.min(limits.maxBet, b.amount + 10),
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mb-2 flex gap-1">
          {[10, 20, 50, 100].map((v) => (
            <button
              key={v}
              type="button"
              disabled={running}
              onClick={() => setBet((b) => ({ ...b, amount: v }))}
              className="flex-1 rounded-lg bg-white/5 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10"
            >
              {v}
            </button>
          ))}
        </div>
        {bet.useAuto && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] text-white/40">{t("Auto cashout", "অটো ক্যাশআউট")}</span>
            <input
              type="number"
              step="0.1"
              min={1.1}
              disabled={running}
              className="w-20 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs font-bold text-white"
              value={bet.auto}
              onChange={(e) =>
                setBet((b) => ({ ...b, auto: Math.max(1.1, Number(e.target.value) || 1.1) }))
              }
            />
            <span className="text-xs text-white/40">x</span>
          </div>
        )}
        {canCash ? (
          <Button
            className="w-full bg-amber-400 font-black text-black hover:bg-amber-300"
            onClick={() => doCashout(1)}
          >
            {t("Cash Out", "ক্যাশ আউট")}{" "}
            <span className="ml-1 opacity-80">
              {formatCoins(Math.floor(bet.amount * display * 100) / 100)} TK
            </span>
          </Button>
        ) : which === 1 ? (
          <Button
            className={cn(
              "w-full font-black",
              running
                ? "bg-white/10 text-white/50"
                : "bg-[#28a909] text-white hover:bg-[#2fbf0a]"
            )}
            disabled={running || !user}
            onClick={startRound}
          >
            {waiting
              ? t("Waiting…", "অপেক্ষা…")
              : `${t("Bet", "বেট")} ${formatCoins(bet.amount)} TK`}
          </Button>
        ) : (
          <Button
            className="w-full bg-[#28a909]/80 font-black text-white"
            disabled={running || !user}
            onClick={() => {
              if (!running) startRound();
            }}
          >
            {bet.placed
              ? t("In play", "চলছে")
              : `${t("Bet", "বেট")} ${formatCoins(bet.amount)} TK`}
          </Button>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p>{t("Login to play Aviator", "এভিয়েটর খেলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button>{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style jsx global>{`
        @keyframes avZoom {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-280px) scale(0.2);
            opacity: 0;
          }
        }
        @keyframes avLoad {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {history.map((h) => (
          <span
            key={h.id}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums",
              histColor(h.crashPoint)
            )}
          >
            {h.crashPoint ? `${Number(h.crashPoint).toFixed(2)}x` : "—"}
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e14] shadow-2xl">
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `url(${BG_SRC})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/50 to-transparent" />

        <div ref={spaceRef} className="relative h-[250px] sm:h-[310px] md:h-[360px]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={planeRef}
            src={PLANE_SRC}
            alt="plane"
            className="pointer-events-none absolute left-0 top-0 z-10 h-14 w-auto drop-shadow-[0_0_14px_rgba(255,80,120,0.75)] will-change-transform"
            style={{
              opacity: phase === "flying" || phase === "cashed" ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          />

          <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white/80 backdrop-blur">
              <Users className="h-3 w-3" /> {livePlayers}
            </span>
            <span className="rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-black tracking-wider text-white">
              AVIATOR
            </span>
          </div>
          <div className="absolute right-3 top-3 z-20 flex gap-1">
            <button
              type="button"
              className="rounded-lg bg-black/55 p-2 text-white/80 backdrop-blur hover:bg-black/70"
              onClick={() => {
                const m = sound.toggleMute();
                setMuted(m);
              }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="rounded-lg bg-black/55 p-2 text-white/80 backdrop-blur hover:bg-black/70"
              onClick={() => {
                const next = !musicOn;
                setMusicOn(next);
                sound.musicOn = next;
                if (next && phase === "flying" && !muted) sound.startMusic();
                else sound.stopMusic();
              }}
            >
              {musicOn ? <Music2 className="h-4 w-4" /> : <Music className="h-4 w-4 opacity-40" />}
            </button>
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "countdown" && (
                <motion.div
                  key="cd"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/aviator/img/propeller.png"
                    alt=""
                    className="mx-auto mb-3 h-14 w-14 animate-spin"
                    style={{ animationDuration: "1.1s" }}
                  />
                  <div className="mx-auto mb-2 h-1.5 w-52 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-400"
                      style={{ animation: "avLoad 5s linear forwards" }}
                    />
                  </div>
                  <div className="text-xs font-bold tracking-[0.2em] text-white/70">
                    {t("PREPARING NEXT ROUND", "পরবর্তী রাউন্ড প্রস্তুত")}
                  </div>
                  <div className="mt-1 text-3xl font-black text-white">{countdown}</div>
                </motion.div>
              )}
              {(phase === "flying" || phase === "cashed") && (
                <motion.div
                  key="fly"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div
                    className={cn(
                      "text-5xl font-black tabular-nums tracking-tight drop-shadow-[0_0_24px_rgba(255,255,255,0.35)] sm:text-6xl",
                      display >= 10 ? "text-amber-300" : "text-white"
                    )}
                  >
                    {display.toFixed(2)}x
                  </div>
                </motion.div>
              )}
              {phase === "crashed" && (
                <motion.div
                  key="crash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-sm font-black uppercase tracking-[0.25em] text-rose-400">
                    {t("FLEW AWAY!", "উড়ে গেছে!")}
                  </div>
                  <div className="mt-1 text-5xl font-black tabular-nums text-rose-400">
                    {(result?.crashPoint ?? display).toFixed(2)}x
                  </div>
                </motion.div>
              )}
              {phase === "idle" && !result && (
                <div className="text-center">
                  <div className="text-xs font-bold tracking-[0.3em] text-rose-300/80">AVIATOR</div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {t("Place your bet", "বেট রাখুন")}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/5 bg-black/45 px-3 py-2 backdrop-blur">
          <div className="flex gap-3 overflow-x-auto text-[10px] text-white/50">
            {fakeBets.map((b, i) => (
              <span key={i} className="shrink-0">
                <span className="text-white/70">{b.name}</span>{" "}
                <span className="text-amber-300/80">{b.amt} TK</span>
              </span>
            ))}
            {!fakeBets.length && (
              <span>{t("All bets appear here", "সব বেট এখানে দেখা যাবে")}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BetCard label={t("Bet 1", "বেট ১")} bet={bet1} setBet={setBet1} which={1} />
        {bet2On ? (
          <BetCard label={t("Bet 2", "বেট ২")} bet={bet2} setBet={setBet2} which={2} />
        ) : (
          <button
            type="button"
            onClick={() => setBet2On(true)}
            className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/40 hover:border-white/30"
          >
            + {t("Add second bet", "দ্বিতীয় বেট")}
          </button>
        )}
      </div>

      {result && (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-center text-sm font-bold",
            result.won
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          )}
        >
          {result.won
            ? `${t("Won", "জিতেছেন")} +${formatCoins(result.payout)} TK`
            : `${t("Crashed at", "ক্র্যাশ")} ${Number(result.crashPoint).toFixed(2)}x`}
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-center text-[10px] text-white/30">
        {t("Max", "ম্যাক্স")}: {limits.maxMultiplier}x · {t("Virtual TK only", "শুধু ভার্চুয়াল TK")} ·
        real Aviator SFX
      </p>

      {result?.serverSeed && (
        <details className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
          <summary className="cursor-pointer font-semibold text-white/80">
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
