"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { sound } from "@/lib/sounds";
import "@/app/aviator.css";
import { randomBdNames } from "@/lib/bd-names";

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

/** Slower climb — feels closer to Spribe start speed */
const GROWTH_DEFAULT = 0.11;
const PLANE_SRC = "/game_aviator/images/sprite2.png";
const PLANE_FALLBACK = "/aviator/img/rocket5.gif";
const BG_SRC = "/aviator/img/bg-image.gif";
const PROP_SRC = "/aviator/img/propeller.png";
/** sprite2.png is a 200×48 sheet with 2 side-by-side frames (classic canvas.js) */
const PLANE_SHEET_W = 200;
const PLANE_FRAME_H = 48;
const PLANE_FRAMES = 2;
const PLANE_FRAME_W = PLANE_SHEET_W / PLANE_FRAMES;

function multFromElapsed(ms: number, growth = GROWTH_DEFAULT) {
  const s = Math.max(0, ms) / 1000;
  return Math.max(1, Math.floor(Math.exp(growth * s) * 100) / 100);
}

/** Quadratic bezier point */
function qBez(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function qBezTangent(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  const u = 1 - t;
  return {
    x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
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

  const [p1, setP1] = useState<PanelUI>(() => emptyPanel(10));
  const [p2, setP2] = useState<PanelUI>(() => emptyPanel(10));
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [cashToast, setCashToast] = useState<{ mult: number; win: number } | null>(null);
  const [animOn, setAnimOn] = useState(true);
  const [histOpen, setHistOpen] = useState(false);
  const [livePlayers, setLivePlayers] = useState(268);
  const [fakePlayers, setFakePlayers] = useState<LivePlayer[]>([]);
  const [realOnline, setRealOnline] = useState(0);
  const aviatorLiveRef = useRef({
    minPlayers: 217,
    maxPlayers: 999,
    nightMin: 700,
    nightMax: 1400,
    nightStartHour: 19,
    nightEndHour: 3,
    fakeBotsMin: 50,
    fakeBotsMax: 100,
    realUserWeight: 12,
  });
  const flyElapsedRef = useRef(0);

  const growth = useRef(GROWTH_DEFAULT);
  const flyStart = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const roundRef = useRef<string | null>(null);
  const raf = useRef<number | null>(null);
  const poll = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeImgRef = useRef<HTMLImageElement | null>(null);
  const planeReady = useRef(false);
  const planeSpriteOk = useRef(false);
  const pathProgress = useRef(0);
  const bobPhase = useRef(0);
  const spaceRef = useRef<HTMLDivElement | null>(null);
  const lastFlySfx = useRef(0);
  const lastPhase = useRef<Phase>("idle");
  const cashing = useRef(false);
  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);
  const axisScroll = useRef(0);
  const crashFlash = useRef(0);
  const displayRef = useRef(display);

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
  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  // Preload plane sprite sheet (classic Aviator frames)
  useEffect(() => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      planeImgRef.current = img;
      planeReady.current = true;
      planeSpriteOk.current = true;
    };
    img.onerror = () => {
      const fb = new Image();
      fb.onload = () => {
        planeImgRef.current = fb;
        planeReady.current = true;
        planeSpriteOk.current = false;
      };
      fb.src = PLANE_FALLBACK;
    };
    img.src = PLANE_SRC;
  }, []);

  const getStageSize = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const w = Math.max(280, parent?.clientWidth || 320);
    const h = Math.max(220, parent?.clientHeight || 260);
    return { w, h };
  }, []);

  /** Classic Aviator curve anchors (bottom-left → right → upper-right) */
  const curveAnchors = useCallback((w: number, h: number) => {
    const axis = Math.max(16, Math.min(24, w * 0.045));
    // Classic Spribe path: low left → mid rise → upper right
    const p0 = { x: axis + 10, y: h - axis - 8 };
    const p1 = { x: w * 0.38, y: h - axis - 10 };
    const p2 = { x: w - 48, y: Math.max(h * 0.18, 48) };
    return { axis, p0, p1, p2 };
  }, []);

  const drawStage = useCallback(
    (mult: number, crashed: boolean, nowMs = performance.now()) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = getStageSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const tw = Math.floor(w * dpr);
      const th = Math.floor(h * dpr);
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // sunburst rays (Spribe stage look)
      const cx = w * 0.5;
      const cy = h * 1.15;
      const rays = 22;
      for (let i = 0; i < rays; i++) {
        const a0 = (-Math.PI * 0.95) + (i / rays) * Math.PI * 1.1;
        const a1 = a0 + (Math.PI * 1.1) / rays * 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Math.max(w, h) * 1.35, a0, a1);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.08)";
        ctx.fill();
      }

      const { axis, p0, p1, p2 } = curveAnchors(w, h);

      // Axis rails + scrolling dots (like reference canvas.js)
      const flying = phaseRef.current === "flying" && !crashed;
      if (flying) {
        axisScroll.current = (axisScroll.current + 1.6) % 28;
      }
      const scroll = axisScroll.current;

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      // x-axis
      ctx.beginPath();
      ctx.moveTo(axis, h - axis);
      ctx.lineTo(w - 8, h - axis);
      ctx.stroke();
      // y-axis
      ctx.beginPath();
      ctx.moveTo(axis, h - axis);
      ctx.lineTo(axis, 12);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let x = axis + 14 - scroll; x < w - 10; x += 28) {
        ctx.beginPath();
        ctx.arc(x, h - axis, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let y = h - axis - 14 + scroll; y > 14; y -= 28) {
        ctx.beginPath();
        ctx.arc(axis, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Progress along bezier from multiplier (smooth, caps near end then bob)
      // Plane path follows elapsed flight time (not slow mult), so plane still moves smoothly
      const elapsedSec = Math.max(0, flyElapsedRef.current / 1000);
      const baseT = Math.min(0.96, 1 - Math.exp(-elapsedSec / 7.5));
      if (flying) {
        pathProgress.current = baseT;
        bobPhase.current = nowMs / 1000;
      } else if (crashed) {
        pathProgress.current = Math.max(pathProgress.current, baseT);
      } else {
        pathProgress.current = 0;
      }

      let tEnd = pathProgress.current;
      // gentle vertical bob after curve is mostly extended
      const bob =
        flying && tEnd > 0.55
          ? Math.sin(bobPhase.current * 3.2) * (6 + (tEnd - 0.55) * 10)
          : 0;

      if (tEnd <= 0.001 && !flying && !crashed) {
        return;
      }

      // Sample curve path
      const steps = Math.max(24, Math.floor(80 * Math.max(0.08, tEnd)));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tEnd;
        const p = qBez(t, p0, p1, p2);
        p.y += bob * (t / Math.max(0.001, tEnd));
        pts.push(p);
      }
      const tip = pts[pts.length - 1] || p0;
      const tan = qBezTangent(tEnd, p0, p1, p2);
      // Clamp plane nose angle so it never flips awkwardly
      let angle = Math.atan2(tan.y + (flying ? bob * 0.08 : 0), Math.max(0.001, tan.x));
      angle = Math.max(-0.85, Math.min(0.15, angle));

      // Filled under-curve
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.lineTo(tip.x, h - axis);
      ctx.lineTo(pts[0].x, h - axis);
      ctx.closePath();
      const under = ctx.createLinearGradient(0, tip.y, 0, h - axis);
      under.addColorStop(0, crashed ? "rgba(255,40,80,0.28)" : "rgba(228, 5, 57, 0.32)");
      under.addColorStop(0.55, "rgba(228, 5, 57, 0.12)");
      under.addColorStop(1, "rgba(228, 5, 57, 0)");
      ctx.fillStyle = under;
      ctx.fill();

      // Glow stroke
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = crashed ? "rgba(255,70,100,0.35)" : "rgba(255,60,100,0.45)";
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Main red graph line
      const lineGrad = ctx.createLinearGradient(pts[0].x, pts[0].y, tip.x, tip.y);
      lineGrad.addColorStop(0, "rgba(255,80,120,0.15)");
      lineGrad.addColorStop(0.35, "#ff2d55");
      lineGrad.addColorStop(1, "#ff4d6d");
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3.4;
      ctx.stroke();

      // Plane
      const img = planeImgRef.current;
      if (img && planeReady.current && (flying || crashed)) {
        const drawW = w < 420 ? 100 : 128;
        const drawH = planeSpriteOk.current
          ? drawW * (PLANE_FRAME_H / PLANE_FRAME_W)
          : drawW * 0.72;
        // original GameObject used ~300ms per frame
        const frame =
          planeSpriteOk.current
            ? Math.floor(nowMs / 150) % PLANE_FRAMES
            : 0;

        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(angle);
        // slight nose-up bias (sprite faces right)
        ctx.rotate(-0.04);

        if (crashed) {
          // fly-away fade flash
          crashFlash.current = Math.min(1, crashFlash.current + 0.04);
          const fly = crashFlash.current;
          ctx.globalAlpha = Math.max(0, 1 - fly);
          ctx.translate(fly * 90, -fly * 70);
          ctx.scale(1 + fly * 0.35, 1 + fly * 0.35);
        } else {
          crashFlash.current = 0;
          ctx.globalAlpha = 1;
        }

        // soft glow under plane
        ctx.shadowColor = "rgba(255, 60, 100, 0.75)";
        ctx.shadowBlur = 18;

        if (planeSpriteOk.current) {
          // match canvas.js: drawImage(sheet, frame*fw, 0, fw, fh, x, y, fw, fh)
          ctx.drawImage(
            img,
            frame * PLANE_FRAME_W,
            0,
            PLANE_FRAME_W,
            PLANE_FRAME_H,
            -drawW * 0.22,
            -drawH * 0.58,
            drawW,
            drawH
          );
        } else {
          ctx.drawImage(img, -drawW * 0.35, -drawH * 0.55, drawW, drawH);
        }
        ctx.restore();
      }
    },
    [curveAnchors, getStageSize]
  );

  function stopRaf() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }

  function startFlyLoop(startedAtIso?: string | null) {
    stopRaf();
    flyStart.current = startedAtIso ? new Date(startedAtIso).getTime() : Date.now();
    pathProgress.current = 0;
    crashFlash.current = 0;
    axisScroll.current = 0;
    const tick = (now: number) => {
      if (phaseRef.current !== "flying") return;
      const elapsed = Date.now() - flyStart.current;
      flyElapsedRef.current = elapsed;
      const m = multFromElapsed(elapsed, growth.current);
      setDisplay(m);
      drawStage(m, false, now);
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
        pathProgress.current = 0;
        crashFlash.current = 0;
        drawStage(1, false);
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
        // animate fly-away briefly
        crashFlash.current = 0;
        const crashStart = performance.now();
        const crashAnim = (now: number) => {
          drawStage(cp, true, now);
          if (now - crashStart < 900) {
            raf.current = requestAnimationFrame(crashAnim);
          }
        };
        raf.current = requestAnimationFrame(crashAnim);
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

    const onResize = () => {
      const m = displayRef.current;
      if (phaseRef.current === "flying") drawStage(m, false);
      else if (phaseRef.current === "crashed") drawStage(m, true);
      else drawStage(1, false);
    };
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined" && spaceRef.current
        ? new ResizeObserver(onResize)
        : null;
    if (spaceRef.current && ro) ro.observe(spaceRef.current);

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

    // load aviator live crowd settings from public config
    fetch("/api/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const live =
          j.data?.gameConfig?.aviator?.aviatorLive ||
          j.data?.gameConfig?.crash?.aviatorLive;
        if (live && typeof live === "object") {
          aviatorLiveRef.current = { ...aviatorLiveRef.current, ...live };
        }
      })
      .catch(() => {});

    poll.current = window.setInterval(() => {
      void pollState();
    }, 400);

    return () => {
      stopRaf();
      if (poll.current) window.clearInterval(poll.current);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      sound.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic displayed crowd + fake bot board (admin-configurable)
  useEffect(() => {
    // names generated per spawn via randomBdNames
    function isNightBd(d = new Date()) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dhaka",
        hour: "numeric",
        hour12: false,
      }).formatToParts(d);
      const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
      const cfg = aviatorLiveRef.current;
      const start = cfg.nightStartHour ?? 19;
      const end = cfg.nightEndHour ?? 3;
      if (start > end) return hour >= start || hour < end;
      return hour >= start && hour < end;
    }
    function targetCount(online: number) {
      const cfg = aviatorLiveRef.current;
      const night = isNightBd();
      const min = night ? cfg.nightMin : cfg.minPlayers;
      const max = night ? cfg.nightMax : cfg.maxPlayers;
      const weighted = min + online * (cfg.realUserWeight || 12);
      const jitter = Math.sin(Date.now() / 9000) * 35 + (Math.random() * 40 - 20);
      return Math.max(min, Math.min(max, Math.round(weighted + jitter)));
    }
    function spawnFakes(roundKey: string) {
      const cfg = aviatorLiveRef.current;
      const n =
        cfg.fakeBotsMin +
        Math.floor(Math.random() * Math.max(1, cfg.fakeBotsMax - cfg.fakeBotsMin + 1));
      const namePool = randomBdNames(n);
      const bots: LivePlayer[] = Array.from({ length: n }).map((_, i) => {
        const amount = [10, 20, 50, 100, 200, 500, 1000][Math.floor(Math.random() * 7)];
        return {
          id: `bot_${roundKey}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          name: namePool[i],
          amount,
          cashedOut: false,
          multiplier: null,
          payout: 0,
        };
      });
      setFakePlayers(bots);
    }
    // initial
    spawnFakes(String(Date.now()));
    setLivePlayers(targetCount(0));

    const id = window.setInterval(() => {
      // real online heartbeat
      fetch("/api/presence", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => {
          const online = Number(j?.data?.online || 0);
          setRealOnline(online);
          setLivePlayers((prev) => {
            const target = targetCount(online);
            // smooth walk toward target
            const step = Math.max(-28, Math.min(28, target - prev));
            return Math.max(1, prev + step + Math.floor(Math.random() * 7 - 3));
          });
        })
        .catch(() => {
          setLivePlayers((prev) => {
            const target = targetCount(realOnline);
            const step = Math.max(-20, Math.min(20, target - prev));
            return Math.max(1, prev + step);
          });
        });

      // occasionally cash out some bots while flying
      if (phaseRef.current === "flying") {
        setFakePlayers((bots) => {
          // cash out at most ~6 bots per tick to avoid re-render lag
          let left = 6;
          return bots.map((b) => {
            if (b.cashedOut || left <= 0) return b;
            if (Math.random() > 0.12) return b;
            left -= 1;
            const mult = Math.max(1.01, Number((displayRef.current * (0.7 + Math.random() * 0.35)).toFixed(2)));
            return {
              ...b,
              cashedOut: true,
              multiplier: mult,
              payout: Math.floor(b.amount * mult * 100) / 100,
            };
          });
        });
      }
    }, 3200);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Respawn fake board each new betting round
  useEffect(() => {
    if (phase !== "betting") return;
    const cfg = aviatorLiveRef.current;
    const n =
      cfg.fakeBotsMin +
      Math.floor(Math.random() * Math.max(1, cfg.fakeBotsMax - cfg.fakeBotsMin + 1));
    const namePool = randomBdNames(n);
    const bots: LivePlayer[] = Array.from({ length: n }).map((_, i) => {
      const amount = [10, 20, 50, 100, 200, 500, 1000, 10000][Math.floor(Math.random() * 8)];
      return {
        id: `bot_${roundId || "r"}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        name: namePool[i],
        amount,
        cashedOut: false,
        multiplier: null,
        payout: 0,
      };
    });
    setFakePlayers(bots);
  }, [phase, roundId]);

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
      setCashToast({
        mult: Number(json.data.multiplier || 0),
        win: Number(json.data.payout || 0),
      });
      window.setTimeout(() => setCashToast(null), 4200);
      toast.success(
        t("You have cashed out!", "ক্যাশআউট হয়েছে!"),
        `${json.data.multiplier}x · +${formatCoins(json.data.payout)} BDT`
      );
      applyLive(json.data);
    } catch {
      /* */
    }
    cashing.current = false;
  }

  async function cancelBet(panel: 1 | 2) {
    const ui = panel === 1 ? p1Ref.current : p2Ref.current;
    // queued for next round — just clear waiting
    if (ui.waiting && !ui.betId) {
      if (panel === 1) setP1((p) => ({ ...p, waiting: false }));
      else setP2((p) => ({ ...p, waiting: false }));
      toast.info(t("Cancelled", "বাতিল"), t("Queued bet removed", "কিউ বেট সরানো হয়েছে"));
      return;
    }
    if (!ui.betId) return;
    try {
      const res = await fetch("/api/games/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cancel", betId: ui.betId, panel }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(t("Cancel failed", "বাতিল ব্যর্থ"), json.error);
        return;
      }
      if (json.data.balance != null) setBalance(json.data.balance);
      if (panel === 1) setP1((p) => ({ ...p, betId: null, waiting: false, cashed: false, cashMult: null, payout: 0 }));
      else setP2((p) => ({ ...p, betId: null, waiting: false, cashed: false, cashMult: null, payout: 0 }));
      toast.info(t("Bet cancelled", "বেট বাতিল"), t("Stake refunded", "স্টেক ফেরত"));
      applyLive(json.data);
    } catch {
      /* */
    }
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
    setBet: Dispatch<SetStateAction<PanelUI>>;
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
              {[100, 200, 500, 10000].map((v) => (
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
              <span className="lbl">Cash Out</span>
              <span className="amt">
                {formatCoins(Math.floor(bet.amount * display * 100) / 100)} BDT
              </span>
            </button>
          ) : isWaitingNext || (bet.waiting && phase !== "betting") ? (
            <button type="button" className="av-action av-btn-danger" onClick={() => cancelBet(which)}>
              <span className="lbl">Cancel</span>
              <span className="amt" style={{ fontSize: 11, fontWeight: 700 }}>
                {t("Waiting for next round", "পরের রাউন্ডের অপেক্ষা")}
              </span>
            </button>
          ) : bet.betId && phase === "betting" ? (
            <button type="button" className="av-action av-btn-danger" onClick={() => cancelBet(which)}>
              <span className="lbl">Cancel</span>
              <span className="amt">
                {formatCoins(bet.amount)} BDT
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="av-action av-btn-success"
              disabled={!user}
              onClick={() => placeBet(which)}
            >
              <span className="lbl">Bet</span>
              <span className="amt">
                {formatCoins(bet.amount)} BDT
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
    <div className="av-root">
      {/* Compact balance + menu (no heavy top bar) */}
      <div className="av-mini-bar">
        <button type="button" className="av-hist-chip" onClick={() => setHistOpen(true)}>
          History
        </button>
        <div className="av-top-balance">
          <span className="num">{user ? formatCoins(user.balance) : "0.00"}</span>
          <span className="cur">BDT</span>
        </div>
        <button type="button" className="av-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
          ☰
        </button>
      </div>

      {cashToast && (
        <div className="av-cash-toast">
          <div className="left">
            <div className="title">{t("You have cashed out!", "ক্যাশআউট হয়েছে!")}</div>
            <div className="mult">{cashToast.mult.toFixed(2)}x</div>
          </div>
          <div className="win-pill">
            <div className="wlab">Win BDT</div>
            <div className="wamt">{formatCoins(cashToast.win)}</div>
          </div>
          <button type="button" className="x" onClick={() => setCashToast(null)}>×</button>
        </div>
      )}

      {histOpen && (
        <div className="av-hist-modal" onClick={() => setHistOpen(false)}>
          <div className="av-hist-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white/80">Round History</div>
              <button type="button" onClick={() => setHistOpen(false)} className="text-white/50">×</button>
            </div>
            <div className="av-hist-grid">
              {history.map((h) => (
                <span key={h.id} className={cn("av-hist", histClass(h.crashPoint))}>
                  {h.crashPoint ? `${Number(h.crashPoint).toFixed(2)}x` : "—"}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="av-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="av-menu" onClick={(e) => e.stopPropagation()}>
            <div className="av-menu-user">
              <div className="av-avatar">{(user?.username || "U")[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{user?.username || "Guest"}</div>
              </div>
            </div>
            <div className="av-menu-row">
              <span>Sound</span>
              <button type="button" className={cn("av-switch-pill", !muted && "on")} onClick={() => { const m = sound.toggleMute(); setMuted(m); }} />
            </div>
            <div className="av-menu-row">
              <span>Music</span>
              <button type="button" className={cn("av-switch-pill", musicOn && "on")} onClick={() => {
                const next = !musicOn; setMusicOn(next); sound.musicOn = next;
                if (next && phase === "flying" && !muted) sound.startMusic(); else sound.stopMusic();
              }} />
            </div>
            <div className="av-menu-row">
              <span>Animation</span>
              <button type="button" className={cn("av-switch-pill", animOn && "on")} onClick={() => setAnimOn((v) => !v)} />
            </div>
            <div className="av-menu-sep" />
            <button type="button" className="av-menu-item" onClick={() => { setMenuOpen(false); setHistOpen(true); }}>My Bet History</button>
            <button type="button" className="av-menu-item" onClick={() => setMenuOpen(false)}>Game Limits</button>
            <button type="button" className="av-menu-item" onClick={() => setMenuOpen(false)}>How To Play</button>
            <button type="button" className="av-menu-item" onClick={() => setMenuOpen(false)}>Game Rules</button>
            <button type="button" className="av-menu-item" onClick={() => setMenuOpen(false)}>Provably Fair Settings</button>
          </div>
        </div>
      )}

      <div className="av-stage">
        <div className="av-stage-bg" style={{ backgroundImage: `url(${BG_SRC})` }} />
        <div className="av-stage-fade" />
        <div className="av-space" ref={spaceRef}>
          <canvas ref={canvasRef} className="av-canvas" aria-label="Aviator flight graph" />
          <div className="av-stage-vignette" />

          <div className="av-players-pill">
            <span className="dots">●●●</span>
            <span>{Math.max(livePlayers, players.length + fakePlayers.length)}</span>
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
            {[...players, ...fakePlayers].slice(0, 20).map((b) => (
              <span key={b.id} className="shrink-0">
                <b>{b.name}</b>{" "}
                {b.cashedOut ? (
                  <span className="text-emerald-400">{Number(b.multiplier || 0).toFixed(2)}x</span>
                ) : (
                  <span className="amt">৳{formatCoins(b.amount)}</span>
                )}
              </span>
            ))}
            {!players.length && !fakePlayers.length && (
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
        <div className="av-board-summary">
          <div className="left">
            <span className="avatars">●●●</span>
            <span>
              {players.length + fakePlayers.length}/
              {Math.max(livePlayers, players.length + fakePlayers.length)} Bets
            </span>
          </div>
          <div className="right">
            <div className="tw">
              {formatCoins(
                [...players, ...fakePlayers].reduce((s, b) => s + (b.payout || 0), 0)
              )}
            </div>
            <div className="tl">Total win BDT</div>
          </div>
        </div>
        <div className="av-board-tabs">
          <div className="av-switch">
            {(
              [
                ["all", t("All Bets", "সব বেট")],
                ["my", t("Previous", "পূর্ববর্তী")],
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
        <div className="av-board-head">
          <span>Player</span>
          <span>Bet BDT</span>
          <span>X</span>
          <span>Win BDT</span>
        </div>
        <div className="av-board-list">
          {boardTab === "all" &&
            [...players, ...fakePlayers].slice(0, 40).map((b) => (
              <div key={b.id} className={cn("av-board-row", b.cashedOut && "won")}>
                <span className="name">{b.name}</span>
                <span>{formatCoins(b.amount)}</span>
                <span className={b.cashedOut ? "xwin" : ""}>
                  {b.cashedOut ? `${Number(b.multiplier).toFixed(2)}x` : ""}
                </span>
                <span className={b.cashedOut ? "win" : ""}>
                  {b.cashedOut ? formatCoins(b.payout) : "0.00"}
                </span>
              </div>
            ))}
          {boardTab === "my" &&
            (myBets.length ? (
              myBets.map((b) => (
                <div key={b.id} className={cn("av-board-row", b.cashedOut && "won")}>
                  <span className="name">P{b.panel}</span>
                  <span>{formatCoins(b.amount)}</span>
                  <span className={b.cashedOut ? "xwin" : ""}>
                    {b.cashedOut ? `${Number(b.multiplier || 0).toFixed(2)}x` : phase === "flying" ? "IN" : ""}
                  </span>
                  <span className={b.cashedOut ? "win" : ""}>
                    {b.cashedOut ? formatCoins(b.payout) : "0.00"}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-white/40">
                {t("No bets yet", "এখনো বেট নেই")}
              </div>
            ))}
          {boardTab === "top" &&
            [...players, ...fakePlayers]
              .sort((a, b) => (b.payout || b.amount) - (a.payout || a.amount))
              .slice(0, 10)
              .map((b, i) => (
                <div key={b.id} className={cn("av-board-row", b.cashedOut && "won")}>
                  <span className="name">
                    #{i + 1} {b.name}
                  </span>
                  <span>{formatCoins(b.amount)}</span>
                  <span className={b.cashedOut ? "xwin" : ""}>
                    {b.cashedOut ? `${Number(b.multiplier).toFixed(2)}x` : ""}
                  </span>
                  <span className={b.cashedOut ? "win" : ""}>
                    {b.cashedOut ? formatCoins(b.payout) : "0.00"}
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
