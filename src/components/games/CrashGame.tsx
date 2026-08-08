"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Volume2, VolumeX, Music2, Music, Users, Clock } from "lucide-react";
import Link from "next/link";
import { sound } from "@/lib/sounds";
import "@/app/aviator.css";

type Hist = { id: string; crashPoint: number | null };
type Phase = "idle" | "countdown" | "flying" | "crashed" | "cashed";

const GROWTH_DEFAULT = 0.23;
const PLANE_SRC = "/aviator/img/rocket5.gif";
const BG_SRC = "/aviator/img/bg-image.gif";
const PROP_SRC = "/aviator/img/propeller.png";
const WAIT_MS = 5000;

/** Aviator reference curve blended with server exp growth for display */
function multFromElapsed(ms: number, growth = GROWTH_DEFAULT) {
  const t = Math.max(0, ms) / 1000;
  const poly =
    1 +
    0.06 * t +
    Math.pow(0.06 * t, 2) -
    Math.pow(0.04 * t, 3) +
    Math.pow(0.04 * t, 4);
  const exp = Math.exp(growth * t);
  // Prefer server exp for cashout sync; poly softens early climb feel
  const v = exp * 0.72 + poly * 0.28;
  return Math.max(1, Math.floor(v * 100) / 100);
}

type BetPanel = {
  amount: number;
  auto: number;
  useAuto: boolean;
  mode: "manual" | "auto";
  placed: boolean;
  cashed: boolean;
  payout: number;
  cashMult: number | null;
};

const emptyBet = (amount: number): BetPanel => ({
  amount,
  auto: 2,
  useAuto: false,
  mode: "manual",
  placed: false,
  cashed: false,
  payout: 0,
  cashMult: null,
});

const NAMES = [
  "Rafi", "Nila", "Karim", "Mitu", "Sakib", "Ayesha", "Joy", "Tania", "Hasan", "Rima",
  "Omar", "Lamia", "Nayeem", "Sajid", "Faria",
];

export function CrashGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();

  const [bet1, setBet1] = useState<BetPanel>(() => emptyBet(20));
  const [bet2, setBet2] = useState<BetPanel>(() => emptyBet(50));
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
  const [waitMs, setWaitMs] = useState(WAIT_MS);
  const [limits, setLimits] = useState({
    minBet: 10,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 100,
  });
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [livePlayers] = useState(() => 180 + Math.floor(Math.random() * 120));
  const [liveBets, setLiveBets] = useState<{ name: string; amt: number; out?: number }[]>([]);
  const [boardTab, setBoardTab] = useState<"all" | "my" | "top">("all");
  const [myBets, setMyBets] = useState<{ mult: number; amt: number; payout: number; won: boolean }[]>([]);

  const startWall = useRef(0);
  const growth = useRef(GROWTH_DEFAULT);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const cashing = useRef(false);
  const autoDone1 = useRef(false);
  const finished = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeRef = useRef<HTMLImageElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const spaceRef = useRef<HTMLDivElement | null>(null);
  const displayRef = useRef(1);
  const bet1Ref = useRef(bet1);
  const roundIdRef = useRef<string | null>(null);
  const lastFlySfx = useRef(0);

  useEffect(() => {
    bet1Ref.current = bet1;
  }, [bet1]);
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
      const delay = Math.random() * 7;
      const duration = 3.5 + Math.random() * 5;
      star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-${size}px;opacity:${0.4 + Math.random() * 0.6};animation-duration:${duration}s;animation-delay:${delay}s;`;
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
    const h = parent?.clientHeight || canvas.clientHeight || 260;
    // Match reference: progress grows with mult
    const progress = Math.min(1, Math.log(Math.max(1.0001, mult)) / Math.log(40));
    const padX = 24;
    const padY = 36;
    const x = padX + (w - padX * 2 - 40) * Math.min(0.92, progress);
    const y = h - padY - (h - padY * 2 - 20) * Math.min(0.88, Math.pow(progress, 0.92));
    const rot = -8 - progress * 28;

    pathRef.current.push({ x, y });
    if (pathRef.current.length > 160) pathRef.current.shift();

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
        grad.addColorStop(0.4, "rgba(255,50,90,0.45)");
        grad.addColorStop(1, "rgba(255,90,130,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.lineTo(x, h);
        ctx.lineTo(path[0].x, h);
        ctx.closePath();
        const fill = ctx.createLinearGradient(0, 0, 0, h);
        fill.addColorStop(0, "rgba(255,40,80,0.22)");
        fill.addColorStop(1, "rgba(255,40,80,0)");
        ctx.fillStyle = fill;
        ctx.fill();
      }
    }

    if (plane) {
      plane.style.opacity = crashed ? "0" : phase === "flying" || phase === "cashed" ? "1" : "0";
      plane.style.transform = `translate(${x - 40}px, ${y - 28}px) rotate(${rot}deg)`;
    }
  }, [phase]);

  const endRound = useCallback(
    (payload: {
      crashPoint: number;
      payout: number;
      won: boolean;
      multiplier: number | null;
      serverSeed?: string;
      serverSeedHash?: string;
      id: string;
      amount?: number;
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
      setHistory((h) => [{ id: payload.id, crashPoint: payload.crashPoint }, ...h].slice(0, 40));
      if (payload.amount != null) {
        setMyBets((m) =>
          [
            {
              mult: payload.multiplier || payload.crashPoint,
              amt: payload.amount!,
              payout: payload.payout,
              won: payload.won,
            },
            ...m,
          ].slice(0, 20)
        );
      }
      if (!payload.won) sound.lose();
      // sprinkle fake cashouts
      setLiveBets((rows) =>
        rows.map((r) =>
          Math.random() > 0.45
            ? { ...r, out: Math.max(1.01, Math.min(payload.crashPoint, 1 + Math.random() * payload.crashPoint)) }
            : r
        )
      );
      setTimeout(() => {
        setBet1((b) => ({ ...emptyBet(b.amount), auto: b.auto, useAuto: b.useAuto, mode: b.mode }));
        setBet2((b) => ({ ...emptyBet(b.amount), auto: b.auto, useAuto: b.useAuto, mode: b.mode }));
        setRoundId(null);
        setPhase("idle");
      }, 2600);
    },
    [placePlane]
  );

  async function doCashout() {
    const id = roundIdRef.current;
    if (!id || cashing.current || finished.current) return;
    const b = bet1Ref.current;
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
            amount: b.amount,
          });
        }
        cashing.current = false;
        return;
      }
      sound.cashout();
      setBalance(json.data.balance);
      const mult = json.data.multiplier as number;
      const payout = json.data.payout as number;
      setBet1((x) => ({ ...x, cashed: true, payout, cashMult: mult }));
      bet1Ref.current = { ...bet1Ref.current, cashed: true, payout, cashMult: mult };
      autoDone1.current = true;
      toast.success(t("Cashed out!", "ক্যাশআউট!"), `${mult}x · +${formatCoins(payout)} TK`);
      endRound({
        crashPoint: json.data.crashPoint || mult,
        payout,
        won: true,
        multiplier: mult,
        serverSeed: json.data.serverSeed,
        serverSeedHash: json.data.serverSeedHash,
        id,
        amount: b.amount,
      });
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

    const tick = () => {
      if (finished.current) return;
      const elapsed = Date.now() - startWall.current;
      const m = multFromElapsed(elapsed, growth.current);
      setDisplay(m);
      displayRef.current = m;
      placePlane(m, false);

      const now = performance.now();
      if (now - lastFlySfx.current > 240) {
        sound.flyTick(m);
        lastFlySfx.current = now;
      }

      const b1 = bet1Ref.current;
      if (b1.placed && b1.useAuto && !autoDone1.current && !b1.cashed && m >= b1.auto) {
        autoDone1.current = true;
        void doCashout();
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
          // keep local curve but snap if server ahead/behind a lot
          const serverM = json.data.current as number;
          if (Math.abs(serverM - displayRef.current) > 0.35) {
            setDisplay(serverM);
            displayRef.current = serverM;
            placePlane(serverM, !!json.data.crashed);
          }
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
            amount: b1.amount,
          });
        }
      } catch {
        /* */
      }
    }, 350);
  }

  async function startRound(fromPanel: 1 | 2 = 1) {
    if (!user || running) return;
    const panel = fromPanel === 1 ? bet1 : bet2;
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
    setWaitMs(WAIT_MS);

    setLiveBets(
      Array.from({ length: 14 }, () => ({
        name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 90),
        amt: [10, 20, 50, 100, 200, 500, 1000][Math.floor(Math.random() * 7)],
      }))
    );

    const t0 = Date.now();
    await new Promise<void>((resolve) => {
      const iv = window.setInterval(() => {
        const left = Math.max(0, WAIT_MS - (Date.now() - t0));
        setWaitMs(left);
        if (Math.floor(left / 1000) !== Math.floor((left + 50) / 1000)) sound.countdown();
        if (left <= 0) {
          window.clearInterval(iv);
          resolve();
        }
      }, 40);
    });

    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: panel.amount,
          autoCashout: panel.useAuto || panel.mode === "auto" ? panel.auto : undefined,
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
          [{ id: json.data.roundId, crashPoint: json.data.crashPoint }, ...h].slice(0, 40)
        );
        setMyBets((m) =>
          [
            {
              mult: json.data.multiplier || json.data.crashPoint,
              amt: panel.amount,
              payout: json.data.payout,
              won: json.data.won,
            },
            ...m,
          ].slice(0, 20)
        );
        setRunning(false);
        setTimeout(() => setPhase("idle"), 2400);
        return;
      }

      setBalance(json.data.balance);
      setRoundId(json.data.roundId);
      roundIdRef.current = json.data.roundId;
      if (json.data.growth) growth.current = json.data.growth;
      if (json.data.limits) setLimits(json.data.limits);

      const mark = (b: BetPanel) => ({ ...b, placed: true, cashed: false, payout: 0, cashMult: null });
      if (fromPanel === 1) {
        setBet1(mark);
        bet1Ref.current = mark(bet1Ref.current);
      } else {
        // server only holds one stake — still use panel amount via bet1 path
        setBet1({ ...mark(panel), amount: panel.amount });
        bet1Ref.current = { ...mark(panel), amount: panel.amount };
        setBet2(mark);
      }
      if (bet2On && fromPanel === 1) setBet2((b) => ({ ...b, placed: true }));

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

  function histClass(cp: number | null) {
    if (!cp) return "mid";
    if (cp < 2) return "low";
    if (cp <= 10) return "mid";
    return "high";
  }

  function BetControl({
    which,
    bet,
    setBet,
    alt,
  }: {
    which: 1 | 2;
    bet: BetPanel;
    setBet: React.Dispatch<React.SetStateAction<BetPanel>>;
    alt?: boolean;
  }) {
    const canCash = phase === "flying" && bet.placed && !bet.cashed && !!roundId && which === 1;
    const waitingCd = phase === "countdown";
    const locked = running;

    return (
      <div className={cn("av-bet", alt && "alt")}>
        {which === 2 && (
          <button
            type="button"
            className="absolute right-2 top-2 text-xs text-white/40 hover:text-white"
            onClick={() => setBet2On(false)}
            disabled={running}
          >
            ✕
          </button>
        )}
        <div className="av-nav">
          <div className="av-switch">
            <button
              type="button"
              className={bet.mode === "manual" ? "active" : ""}
              disabled={locked}
              onClick={() => setBet((b) => ({ ...b, mode: "manual", useAuto: false }))}
            >
              {t("Bet", "বেট")}
            </button>
            <button
              type="button"
              className={bet.mode === "auto" ? "active" : ""}
              disabled={locked}
              onClick={() => setBet((b) => ({ ...b, mode: "auto", useAuto: true }))}
            >
              {t("Auto", "অটো")}
            </button>
          </div>
        </div>

        <div className="av-row">
          <div className="av-spinner-wrap">
            <div className="av-spinner">
              <button
                type="button"
                disabled={locked}
                onClick={() =>
                  setBet((b) => ({
                    ...b,
                    amount: Math.max(limits.minBet, Math.floor(b.amount - 10)),
                  }))
                }
              >
                −
              </button>
              <input
                type="number"
                value={bet.amount}
                disabled={locked}
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
                disabled={locked}
                onClick={() =>
                  setBet((b) => ({
                    ...b,
                    amount: Math.min(limits.maxBet, b.amount + 10),
                  }))
                }
              >
                +
              </button>
            </div>
            <div className="av-opts">
              {[20, 50, 100, 1000].map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={locked}
                  onClick={() => setBet((b) => ({ ...b, amount: Math.min(limits.maxBet, v) }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {canCash ? (
            <button type="button" className="av-action av-btn-cash" onClick={() => doCashout()}>
              <span className="lbl">CASHOUT</span>
              <span className="amt">
                {formatCoins(Math.floor(bet.amount * display * 100) / 100)}
                <span className="cur">TK</span>
              </span>
            </button>
          ) : waitingCd && bet.placed ? (
            <button type="button" className="av-action av-btn-danger" disabled>
              <span className="lbl">WAITING</span>
            </button>
          ) : (
            <button
              type="button"
              className="av-action av-btn-success"
              disabled={running || !user}
              onClick={() => startRound(which)}
            >
              <span className="lbl">BET</span>
              <span className="amt">
                {formatCoins(bet.amount)}
                <span className="cur">TK</span>
              </span>
            </button>
          )}
        </div>

        {bet.mode === "auto" && (
          <div className="av-auto-row">
            <label>{t("Auto Cash Out", "অটো ক্যাশআউট")}</label>
            <button
              type="button"
              className={cn("av-toggle", !bet.useAuto && "off")}
              disabled={locked}
              onClick={() => setBet((b) => ({ ...b, useAuto: !b.useAuto }))}
            >
              <span />
            </button>
            <div className="av-auto-x">
              <input
                type="number"
                step="0.1"
                min={1.01}
                disabled={locked || !bet.useAuto}
                value={bet.auto}
                onChange={(e) =>
                  setBet((b) => ({ ...b, auto: Math.max(1.01, Number(e.target.value) || 1.01) }))
                }
              />
              <em>x</em>
            </div>
          </div>
        )}

        {bet.cashed && (
          <div className="text-center text-[11px] font-bold text-emerald-400">
            {bet.cashMult?.toFixed(2)}x · +{formatCoins(bet.payout)} TK
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
        <p>{t("Login to play Aviator", "এভিয়েটর খেলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button>{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  const loadPct = Math.max(0, Math.min(100, (waitMs / WAIT_MS) * 100));

  return (
    <div className="av-root space-y-1">
      {/* history */}
      <div className="av-history">
        <div className="av-history-track">
          {history.map((h) => (
            <span key={h.id} className={cn("av-hist", histClass(h.crashPoint))}>
              {h.crashPoint ? `${Number(h.crashPoint).toFixed(2)}x` : "—"}
            </span>
          ))}
          {!history.length && (
            <span className="text-[11px] text-white/40">{t("No rounds yet", "এখনো রাউন্ড নেই")}</span>
          )}
        </div>
        <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
      </div>

      {/* stage */}
      <div className="av-stage">
        <div className="av-stage-bg" style={{ backgroundImage: `url(${BG_SRC})` }} />
        <div className="av-stage-fade" />
        <div className="av-space" ref={spaceRef}>
          <canvas ref={canvasRef} className="av-canvas" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={planeRef}
            src={PLANE_SRC}
            alt="plane"
            className="av-plane"
            style={{ opacity: 0 }}
          />

          <div className="av-hud-top">
            <div className="flex items-center gap-2">
              <span className="av-pill">
                <Users className="h-3 w-3" /> {livePlayers}
              </span>
              <span className="av-brand">AVIATOR</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="av-icon-btn"
                onClick={() => {
                  const m = sound.toggleMute();
                  setMuted(m);
                }}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="av-icon-btn"
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
          </div>

          <div className="av-center">
            {phase === "countdown" && (
              <div className="av-loading">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PROP_SRC} alt="" className="av-prop" />
                <div className="av-loadbar">
                  <div className="av-loadfill" style={{ width: `${loadPct}%` }} />
                </div>
                <div className="av-loadtext">{t("PREPARING NEXT ROUND", "পরবর্তী রাউন্ড প্রস্তুত")}</div>
              </div>
            )}
            {(phase === "flying" || phase === "cashed") && (
              <div className={cn("av-mult", display >= 10 && "hot")}>{display.toFixed(2)}x</div>
            )}
            {phase === "crashed" && (
              <>
                <div className="av-flew">{t("FLEW AWAY!", "উড়ে গেছে!")}</div>
                <div className="av-mult crash">
                  {(result?.crashPoint ?? display).toFixed(2)}x
                </div>
              </>
            )}
            {phase === "idle" && !result && (
              <div>
                <div className="text-[11px] font-black tracking-[0.35em] text-rose-300/80">AVIATOR</div>
                <div className="mt-1 text-xl font-black text-white">
                  {t("Place your bet", "বেট রাখুন")}
                </div>
              </div>
            )}
          </div>

          <div className="av-live">
            {liveBets.map((b, i) => (
              <span key={i} className="shrink-0">
                <b>{b.name}</b>{" "}
                {b.out ? (
                  <span className="win text-emerald-400">{b.out.toFixed(2)}x</span>
                ) : (
                  <span className="amt">{b.amt} TK</span>
                )}
              </span>
            ))}
            {!liveBets.length && (
              <span>{t("All bets appear here", "সব বেট এখানে দেখা যাবে")}</span>
            )}
          </div>
        </div>
      </div>

      {/* dual bets */}
      <div className="av-bets">
        <BetControl which={1} bet={bet1} setBet={setBet1} />
        {bet2On ? (
          <BetControl which={2} bet={bet2} setBet={setBet2} alt />
        ) : (
          <button
            type="button"
            onClick={() => setBet2On(true)}
            className="av-bet flex items-center justify-center border border-dashed border-white/15 text-sm text-white/40"
          >
            + {t("Add second bet", "দ্বিতীয় বেট")}
          </button>
        )}
      </div>

      {/* live board */}
      <div className="av-board">
        <div className="av-board-tabs">
          <div className="av-switch">
            {(
              [
                ["all", t("All Bets", "সব বেট")],
                ["my", t("My Bets", "আমার বেট")],
                ["top", t("Top", "টপ")],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={boardTab === k ? "active" : ""}
                onClick={() => setBoardTab(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="av-board-list">
          {boardTab === "all" &&
            liveBets.map((b, i) => (
              <div key={i} className="av-board-row">
                <span className="name">{b.name}</span>
                <span>{b.amt} TK</span>
                <span className={b.out ? "win" : ""}>
                  {b.out ? `${b.out.toFixed(2)}x` : "—"}
                </span>
              </div>
            ))}
          {boardTab === "my" &&
            (myBets.length ? (
              myBets.map((b, i) => (
                <div key={i} className="av-board-row">
                  <span className="name">{b.won ? "WIN" : "OUT"}</span>
                  <span>{b.amt} TK</span>
                  <span className={b.won ? "win" : ""}>
                    {b.won ? `+${formatCoins(b.payout)}` : `${Number(b.mult).toFixed(2)}x`}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-white/40">
                {t("No bets yet", "এখনো বেট নেই")}
              </div>
            ))}
          {boardTab === "top" &&
            [...liveBets]
              .sort((a, b) => b.amt - a.amt)
              .slice(0, 8)
              .map((b, i) => (
                <div key={i} className="av-board-row">
                  <span className="name">#{i + 1} {b.name}</span>
                  <span>{b.amt} TK</span>
                  <span className="win">{(b.out || 0).toFixed?.(2) || "—"}</span>
                </div>
              ))}
        </div>
        <div className="av-board-foot">
          {t("This game is Provably Fair · Virtual TK only", "প্রুভেবলি ফেয়ার · শুধু ভার্চুয়াল TK")}
        </div>
      </div>

      {result && (
        <div className={cn("av-result", result.won ? "win" : "lose")}>
          {result.won
            ? `${t("Won", "জিতেছেন")} +${formatCoins(result.payout)} TK @ ${Number(result.multiplier || result.crashPoint).toFixed(2)}x`
            : `${t("Flew away at", "উড়ে গেছে")} ${Number(result.crashPoint).toFixed(2)}x`}
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}

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
