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

type Phase = "betting" | "flying" | "crashed" | "idle";
type Hist = { id: string; crashPoint: number | null };
type LivePlayer = {
  id: string;
  name: string;
  amount: number;
  cashedOut: boolean;
  multiplier: number | null;
  payout: number;
  panel?: number;
};
type MyBet = {
  id: string;
  amount: number;
  cashedOut: boolean;
  multiplier: number | null;
  payout: number;
  panel: number;
  autoCashout: number | null;
  won: boolean;
};

const GROWTH_DEFAULT = 0.23;
const PLANE_SRC = "/aviator/img/rocket5.gif";
const BG_SRC = "/aviator/img/bg-image.gif";
const PROP_SRC = "/aviator/img/propeller.png";

function multFromElapsed(ms: number, growth = GROWTH_DEFAULT) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(growth * s) * 100) / 100);
}

type PanelUI = {
  amount: number;
  auto: number;
  useAuto: boolean;
  mode: "manual" | "auto";
  waiting: boolean;
  betId: string | null;
  cashed: boolean;
  cashMult: number | null;
  payout: number;
};

const emptyPanel = (amount: number): PanelUI => ({
  amount,
  auto: 2,
  useAuto: false,
  mode: "manual",
  waiting: false,
  betId: null,
  cashed: false,
  cashMult: null,
  payout: 0,
});

export function CrashGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();

  const [p1, setP1] = useState<PanelUI>(() => emptyPanel(20));
  const [p2, setP2] = useState<PanelUI>(() => emptyPanel(50));
  const [bet2On, setBet2On] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [display, setDisplay] = useState(1);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [history, setHistory] = useState<Hist[]>([]);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [myBets, setMyBets] = useState<MyBet[]>([]);
  const [boardTab, setBoardTab] = useState<"all" | "my" | "top">("all");
  const [limits, setLimits] = useState({
    minBet: 10,
    maxBet: 5000,
    maxWin: 50000,
    maxMultiplier: 100,
  });
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [error, setError] = useState("");
  const [resultBanner, setResultBanner] = useState<string | null>(null);
  const [livePlayers] = useState(() => 220 + Math.floor(Math.random() * 80));

  const growth = useRef(GROWTH_DEFAULT);
  const flyStart = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const roundRef = useRef<string | null>(null);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeRef = useRef<HTMLImageElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const spaceRef = useRef<HTMLDivElement | null>(null);
  const lastFlySfx = useRef(0);
  const lastPhase = useRef<Phase>("idle");
  const cashing = useRef(false);
  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);

  useEffect(() => {
    p1Ref.current = p1;
  }, [p1]);
  useEffect(() => {
    p2Ref.current = p2;
  }, [p2]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    roundRef.current = roundId;
  }, [roundId]);

  const placePlane = useCallback((mult: number, crashed: boolean) => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || 300;
    const h = parent?.clientHeight || 260;
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
      const show = !crashed && phaseRef.current === "flying";
      plane.style.opacity = show ? "1" : "0";
      plane.style.transform = `translate3d(${x - 40}px, ${y - 28}px, 0) rotate(${rot}deg)`;
    }
  }, []);

  function stopRaf() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }

  function startFlyLoop(startedAtIso?: string | null) {
    stopRaf();
    flyStart.current = startedAtIso ? new Date(startedAtIso).getTime() : Date.now();
    pathRef.current = [];
    const tick = () => {
      if (phaseRef.current !== "flying") return;
      const elapsed = Date.now() - flyStart.current;
      const m = multFromElapsed(elapsed, growth.current);
      setDisplay(m);
      placePlane(m, false);
      const now = performance.now();
      if (now - lastFlySfx.current > 240) {
        sound.flyTick(m);
        lastFlySfx.current = now;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function applyLive(live: Record<string, unknown> | null | undefined) {
    if (!live) return;
    const nextPhase = (live.phase as Phase) || "idle";
    const rid = (live.roundId as string) || null;

    if (typeof live.growth === "number") growth.current = live.growth as number;
    if (live.limits) setLimits(live.limits as typeof limits);
    setRoundId(rid);
    setMsLeft(Number(live.msLeft || 0));
    setPlayers((live.players as LivePlayer[]) || []);
    const mine = (live.myBets as MyBet[]) || [];
    setMyBets(mine);

    // sync panels from my bets
    const b1 = mine.find((b) => b.panel === 1);
    const b2 = mine.find((b) => b.panel === 2);
    if (b1) {
      setP1((p) => ({
        ...p,
        betId: b1.id,
        waiting: false,
        cashed: b1.cashedOut,
        cashMult: b1.multiplier,
        payout: b1.payout,
        amount: b1.amount || p.amount,
      }));
    } else if (nextPhase === "betting" && !p1Ref.current.waiting) {
      setP1((p) => ({ ...p, betId: null, cashed: false, cashMult: null, payout: 0 }));
    }
    if (b2) {
      setP2((p) => ({
        ...p,
        betId: b2.id,
        waiting: false,
        cashed: b2.cashedOut,
        cashMult: b2.multiplier,
        payout: b2.payout,
        amount: b2.amount || p.amount,
      }));
    } else if (nextPhase === "betting" && !p2Ref.current.waiting) {
      setP2((p) => ({ ...p, betId: null, cashed: false, cashMult: null, payout: 0 }));
    }

    // phase transitions + SFX
    if (nextPhase !== lastPhase.current) {
      if (nextPhase === "betting") {
        stopRaf();
        sound.stopMusic();
        setDisplay(1);
        pathRef.current = [];
        placePlane(1, true);
        setResultBanner(null);
        // clear waiting flags when new betting opens — place queued bets
        void flushWaitingBets();
      }
      if (nextPhase === "flying") {
        sound.takeoff();
        if (musicOn && !muted) sound.startMusic();
        startFlyLoop(live.flyStartedAt as string | null);
      }
      if (nextPhase === "crashed") {
        stopRaf();
        sound.stopMusic();
        sound.crash();
        const cp = Number(live.crashPoint || live.current || 1);
        setDisplay(cp);
        placePlane(cp, true);
        const won = mine.some((b) => b.cashedOut && b.payout > 0);
        const total = mine.reduce((s, b) => s + (b.payout || 0), 0);
        setResultBanner(
          won
            ? `${t("Won", "জিতেছেন")} +${formatCoins(total)} BDT`
            : `${t("Flew away at", "উড়ে গেছে")} ${cp.toFixed(2)}x`
        );
        if (live.crashPoint) {
          setHistory((h) =>
            [{ id: rid || String(Date.now()), crashPoint: Number(live.crashPoint) }, ...h].slice(
              0,
              40
            )
          );
        }
      }
      lastPhase.current = nextPhase;
    }

    setPhase(nextPhase);
    if (nextPhase === "flying" && typeof live.current === "number") {
      // light server snap
      const serverM = live.current as number;
      setDisplay((d) => (Math.abs(d - serverM) > 0.4 ? serverM : d));
    }
    if (nextPhase === "crashed" && live.crashPoint) {
      setDisplay(Number(live.crashPoint));
    }
    if (nextPhase === "betting") {
      setDisplay(1);
    }
  }

  async function flushWaitingBets() {
    const jobs: { panel: 1 | 2; amount: number; auto?: number }[] = [];
    if (p1Ref.current.waiting) {
      jobs.push({
        panel: 1,
        amount: p1Ref.current.amount,
        auto: p1Ref.current.useAuto ? p1Ref.current.auto : undefined,
      });
    }
    if (bet2On && p2Ref.current.waiting) {
      jobs.push({
        panel: 2,
        amount: p2Ref.current.amount,
        auto: p2Ref.current.useAuto ? p2Ref.current.auto : undefined,
      });
    }
    for (const j of jobs) {
      await placeBet(j.panel, j.amount, j.auto, true);
    }
  }

  async function pollState() {
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "state" }),
      });
      const json = await res.json();
      if (!json.ok) return;
      if (json.data.balance != null) setBalance(json.data.balance);
      applyLive(json.data);
    } catch {
      /* */
    }
  }

  useEffect(() => {
    // stars
    const el = spaceRef.current;
    if (el) {
      el.querySelectorAll(".av-star").forEach((n) => n.remove());
      for (let i = 0; i < 40; i++) {
        const star = document.createElement("div");
        star.className = "av-star";
        const size = Math.random() * 2 + 0.5;
        star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-${size}px;opacity:${0.4 + Math.random() * 0.6};animation-duration:${3.5 + Math.random() * 5}s;animation-delay:${Math.random() * 7}s;`;
        el.appendChild(star);
      }
    }

    fetch("/api/games/crash")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setHistory(j.data.history || []);
        if (j.data.limits) setLimits(j.data.limits);
        if (j.data.growth) growth.current = j.data.growth;
        if (j.data.live) applyLive(j.data.live);
      })
      .catch(() => {});

    poll.current = window.setInterval(() => {
      void pollState();
    }, 400);

    return () => {
      stopRaf();
      if (poll.current) window.clearInterval(poll.current);
      sound.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function placeBet(
    panel: 1 | 2,
    amount?: number,
    auto?: number,
    fromQueue = false
  ) {
    if (!user) return;
    await sound.unlock();
    const ui = panel === 1 ? p1Ref.current : p2Ref.current;
    const amt = amount ?? ui.amount;
    const autoX = auto ?? (ui.useAuto || ui.mode === "auto" ? ui.auto : undefined);
    setError("");

    // if flying/crashed → queue for next round
    if (phaseRef.current !== "betting" && !fromQueue) {
      if (panel === 1) setP1((p) => ({ ...p, waiting: true, amount: amt }));
      else setP2((p) => ({ ...p, waiting: true, amount: amt }));
      sound.bet();
      toast.info(t("Queued", "কিউ"), t("Waiting for next round", "পরবর্তী রাউন্ডের অপেক্ষা"));
      return;
    }

    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "bet",
          amount: amt,
          panel,
          autoCashout: autoX,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        // waiting payload
        if (json.data?.waiting) {
          if (panel === 1) setP1((p) => ({ ...p, waiting: true }));
          else setP2((p) => ({ ...p, waiting: true }));
          applyLive(json.data);
          return;
        }
        setError(json.error || "Bet failed");
        toast.error(t("Bet failed", "বেট ব্যর্থ"), json.error);
        return;
      }
      if (json.data.waiting) {
        if (panel === 1) setP1((p) => ({ ...p, waiting: true }));
        else setP2((p) => ({ ...p, waiting: true }));
        applyLive(json.data);
        return;
      }
      sound.bet();
      if (json.data.balance != null) setBalance(json.data.balance);
      applyLive(json.data);
      if (panel === 1) setP1((p) => ({ ...p, waiting: false, betId: json.data.betId }));
      else setP2((p) => ({ ...p, waiting: false, betId: json.data.betId }));
    } catch {
      setError("Network error");
    }
  }

  async function doCashout(panel: 1 | 2) {
    if (cashing.current || phaseRef.current !== "flying") return;
    const ui = panel === 1 ? p1Ref.current : p2Ref.current;
    if (!ui.betId || ui.cashed) return;
    cashing.current = true;
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cashout", betId: ui.betId, panel }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (json.data?.crashed) {
          applyLive(json.data);
        } else {
          setError(json.error || "Cashout failed");
        }
        cashing.current = false;
        return;
      }
      if (json.data.crashed && !json.data.cashedOut) {
        applyLive(json.data);
        cashing.current = false;
        return;
      }
      sound.cashout();
      if (json.data.balance != null) setBalance(json.data.balance);
      toast.success(
        t("Cashed out!", "ক্যাশআউট!"),
        `${json.data.multiplier}x · +${formatCoins(json.data.payout)} BDT`
      );
      applyLive(json.data);
    } catch {
      /* */
    }
    cashing.current = false;
  }

  function histClass(cp: number | null) {
    if (!cp) return "mid";
    if (cp < 2) return "low";
    if (cp <= 10) return "mid";
    return "high";
  }

  function Panel({
    which,
    bet,
    setBet,
    alt,
  }: {
    which: 1 | 2;
    bet: PanelUI;
    setBet: React.Dispatch<React.SetStateAction<PanelUI>>;
    alt?: boolean;
  }) {
    const hasLiveBet = !!bet.betId && !bet.cashed && phase === "flying";
    const canCash = hasLiveBet;
    const isWaitingNext = bet.waiting && phase !== "betting";
    const locked = phase === "flying" && !!bet.betId;

    return (
      <div className={cn("av-bet", alt && "alt")}>
        {which === 2 && (
          <button
            type="button"
            className="absolute right-2 top-2 text-xs text-white/40 hover:text-white"
            onClick={() => setBet2On(false)}
            disabled={!!bet.betId && phase === "flying"}
          >
            x
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
                -
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
            <button type="button" className="av-action av-btn-cash" onClick={() => doCashout(which)}>
              <span className="lbl">CASHOUT</span>
              <span className="amt">
                {formatCoins(Math.floor(bet.amount * display * 100) / 100)}
                <span className="cur">TK</span>
              </span>
            </button>
          ) : isWaitingNext || (bet.waiting && phase === "flying") ? (
            <button type="button" className="av-action av-btn-danger" disabled>
              <span className="lbl">WAITING</span>
              <span className="amt" style={{ fontSize: 10 }}>
                {t("Next round", "পরের রাউন্ড")}
              </span>
            </button>
          ) : bet.betId && phase === "betting" ? (
            <button type="button" className="av-action av-btn-wait" disabled>
              <span className="lbl">ACCEPTED</span>
              <span className="amt">
                {formatCoins(bet.amount)}
                <span className="cur">TK</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="av-action av-btn-success"
              disabled={!user}
              onClick={() => placeBet(which)}
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
            {bet.cashMult?.toFixed(2)}x · +{formatCoins(bet.payout)} BDT
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

  const loadPct =
    phase === "betting" ? Math.max(0, Math.min(100, (msLeft / 5000) * 100)) : 0;

  return (
    <div className="av-root space-y-1">
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

      <div className="av-stage">
        <div className="av-stage-bg" style={{ backgroundImage: `url(${BG_SRC})` }} />
        <div className="av-stage-fade" />
        <div className="av-space" ref={spaceRef}>
          <canvas ref={canvasRef} className="av-canvas" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={planeRef} src={PLANE_SRC} alt="plane" className="av-plane" style={{ opacity: 0 }} />

          <div className="av-hud-top">
            <div className="flex items-center gap-2">
              <span className="av-pill">
                <Users className="h-3 w-3" /> {Math.max(livePlayers, players.length)}
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
            {phase === "betting" && (
              <div className="av-loading">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PROP_SRC} alt="" className="av-prop" />
                <div className="av-loadbar">
                  <div className="av-loadfill" style={{ width: `${loadPct}%` }} />
                </div>
                <div className="av-loadtext">
                  {t("PREPARING NEXT ROUND", "পরবর্তী রাউন্ড প্রস্তুত")}
                </div>
                <div className="text-2xl font-black text-white tabular-nums">
                  {(msLeft / 1000).toFixed(1)}s
                </div>
              </div>
            )}
            {phase === "flying" && (
              <div className={cn("av-mult", display >= 10 && "hot")}>{display.toFixed(2)}x</div>
            )}
            {phase === "crashed" && (
              <>
                <div className="av-flew">{t("FLEW AWAY!", "উড়ে গেছে!")}</div>
                <div className="av-mult crash">{display.toFixed(2)}x</div>
              </>
            )}
            {phase === "idle" && (
              <div>
                <div className="text-[11px] font-black tracking-[0.35em] text-rose-300/80">AVIATOR</div>
                <div className="mt-1 text-xl font-black text-white">
                  {t("Connecting…", "কানেক্ট হচ্ছে…")}
                </div>
              </div>
            )}
          </div>

          <div className="av-live">
            {players.slice(0, 16).map((b) => (
              <span key={b.id} className="shrink-0">
                <b>{b.name}</b>{" "}
                {b.cashedOut ? (
                  <span className="text-emerald-400">{Number(b.multiplier || 0).toFixed(2)}x</span>
                ) : (
                  <span className="amt">৳{formatCoins(b.amount)}</span>
                )}
              </span>
            ))}
            {!players.length && (
              <span>{t("Place bets for this round", "এই রাউন্ডে বেট রাখুন")}</span>
            )}
          </div>
        </div>
      </div>

      <div className="av-bets">
        <Panel which={1} bet={p1} setBet={setP1} />
        {bet2On ? (
          <Panel which={2} bet={p2} setBet={setP2} alt />
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
            players.map((b) => (
              <div key={b.id} className="av-board-row">
                <span className="name">{b.name}</span>
                <span>৳{formatCoins(b.amount)}</span>
                <span className={b.cashedOut ? "win" : ""}>
                  {b.cashedOut ? `${Number(b.multiplier).toFixed(2)}x` : "—"}
                </span>
              </div>
            ))}
          {boardTab === "my" &&
            (myBets.length ? (
              myBets.map((b) => (
                <div key={b.id} className="av-board-row">
                  <span className="name">P{b.panel}</span>
                  <span>৳{formatCoins(b.amount)}</span>
                  <span className={b.cashedOut ? "win" : ""}>
                    {b.cashedOut ? `+${formatCoins(b.payout)}` : phase === "flying" ? "IN" : "—"}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-white/40">
                {t("No bets yet", "এখনো বেট নেই")}
              </div>
            ))}
          {boardTab === "top" &&
            [...players]
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10)
              .map((b, i) => (
                <div key={b.id} className="av-board-row">
                  <span className="name">
                    #{i + 1} {b.name}
                  </span>
                  <span>৳{formatCoins(b.amount)}</span>
                  <span className="win">
                    {b.cashedOut ? `${Number(b.multiplier).toFixed(2)}x` : "—"}
                  </span>
                </div>
              ))}
        </div>
        <div className="av-board-foot">
          {t(
            "Shared live rounds · Provably Fair · Virtual BDT only",
            "শেয়ার্ড লাইভ রাউন্ড · প্রুভেবলি ফেয়ার · শুধু ভার্চুয়াল BDT"
          )}
        </div>
      </div>

      {resultBanner && (
        <div className={cn("av-result", resultBanner.includes("+") ? "win" : "lose")}>
          {resultBanner}
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
