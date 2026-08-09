"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { sound } from "@/lib/sounds";

const FALLBACK = [0, 1.2, 0, 1.5, 0, 1.8, 0, 2, 0, 1.2, 0, 3, 0, 1.5, 0, 5];

const SEG_COLORS = [
  "#0f172a",
  "#d97706",
  "#111827",
  "#0284c7",
  "#1e293b",
  "#ca8a04",
  "#0b1220",
  "#0d9488",
  "#1e293b",
  "#ea580c",
  "#0f172a",
  "#7c3aed",
  "#1e293b",
  "#b45309",
  "#111827",
  "#e11d48",
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

export function WheelGame() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState(FALLBACK);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean } | null>(null);
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState<number | null>(null);

  const n = segments.length;
  const slice = 360 / n;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  const wedges = useMemo(
    () =>
      segments.map((m, i) => {
        const start = i * slice;
        const end = (i + 1) * slice;
        const mid = start + slice / 2;
        const labelPos = polar(cx, cy, r * 0.68, mid);
        return {
          i,
          m,
          path: wedgePath(cx, cy, r, start, end),
          mid,
          labelPos,
          color: SEG_COLORS[i % SEG_COLORS.length],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, n, slice]
  );

  async function play() {
    if (!user || spinning) return;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setHighlight(null);
    try {
      const res = await fetch("/api/games/wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error);
        toast.error(t("Spin failed", "স্পিন ব্যর্থ"), json.error);
        setSpinning(false);
        return;
      }
      if (Array.isArray(json.data.segments)) setSegments(json.data.segments);
      const segs: number[] = json.data.segments || segments;
      const idx = json.data.index as number;
      const count = segs.length;
      const segAng = 360 / count;
      // Pointer is at top (0°). Wheel rotates clockwise in CSS.
      // Segment i center is at mid = i*seg + seg/2 from 0 (which is top in our SVG polar helper).
      // After rotation R, world angle of segment center = mid + R (mod 360).
      // Want mid + R ≡ 0 (mod 360) under pointer → R ≡ -mid
      const mid = idx * segAng + segAng / 2;
      const current = ((rotation % 360) + 360) % 360;
      const desired = ((-mid) % 360 + 360) % 360;
      let delta = desired - current;
      if (delta <= 0) delta += 360;
      const target = rotation + delta + 360 * 6;
      setRotation(target);

      let ticks = 0;
      const iv = window.setInterval(() => {
        sound.spin();
        ticks += 1;
        if (ticks > 24) window.clearInterval(iv);
      }, 150);

      window.setTimeout(() => {
        window.clearInterval(iv);
        setHighlight(idx);
        setResult({ mult: json.data.multiplier, payout: json.data.payout, won: json.data.won });
        setBalance(json.data.balance);
        setSpinning(false);
        if (json.data.won) {
          sound.win();
          toast.success(
            t("Winner", "বিজয়ী"),
            `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
          );
        } else {
          sound.lose();
        }
      }, 5000);
    } catch {
      setError("Network error");
      setSpinning(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button>{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-amber-400/20 bg-gradient-to-b from-[#1a1205] via-[#0b0a08] to-black p-4 shadow-card sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.18),transparent_55%)]" />
        <div className="relative mb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/60">
            Fortune Wheel
          </div>
          <div className="text-sm font-semibold text-white/70">
            {t("Spin for multipliers", "মাল্টিপ্লায়ারের জন্য স্পিন")}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center">
          {/* pointer */}
          <div className="relative z-30 -mb-2 flex flex-col items-center">
            <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]" />
          </div>

          <div className="relative" style={{ width: size, height: size }}>
            {/* outer rim */}
            <div className="absolute inset-0 rounded-full border-[10px] border-[#4a3210] shadow-[0_0_36px_rgba(251,191,36,0.22)]" />
            <div className="absolute inset-[8px] rounded-full border border-amber-300/35" />

            <div
              className="absolute inset-[10px]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? "transform 4.9s cubic-bezier(0.08, 0.85, 0.05, 1)"
                  : "none",
              }}
            >
              <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full drop-shadow-lg">
                <defs>
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {wedges.map((w) => (
                  <g key={w.i}>
                    <path
                      d={w.path}
                      fill={w.color}
                      stroke={highlight === w.i ? "#fde68a" : "rgba(255,255,255,0.12)"}
                      strokeWidth={highlight === w.i ? 3 : 1}
                    />
                    <text
                      x={w.labelPos.x}
                      y={w.labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={highlight === w.i ? "#fef3c7" : "#fff"}
                      fontSize={w.m >= 3 ? 13 : 12}
                      fontWeight={800}
                      style={{
                        transform: `rotate(${w.mid}deg)`,
                        transformOrigin: `${w.labelPos.x}px ${w.labelPos.y}px`,
                        paintOrder: "stroke",
                        stroke: "rgba(0,0,0,0.55)",
                        strokeWidth: 2.5,
                      }}
                    >
                      {w.m === 0 ? "×" : `${w.m}x`}
                    </text>
                  </g>
                ))}
                {/* hub ring */}
                <circle cx={cx} cy={cy} r={34} fill="#0b0f14" stroke="#fbbf24" strokeWidth={3} />
                <circle cx={cx} cy={cy} r={28} fill="url(#hubGrad)" />
              </svg>
              {/* hub label (doesn't rotate with text path issues) */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gradient-to-b from-slate-800 to-black text-[10px] font-black tracking-[0.2em] text-amber-200 shadow-gold">
                  SPIN
                </div>
              </div>
            </div>
          </div>

          {/* prize legend */}
          <div className="mt-3 grid w-full grid-cols-4 gap-1.5 sm:grid-cols-8">
            {Array.from(new Set(segments)).sort((a, b) => a - b).map((m) => (
              <div
                key={m}
                className={cn(
                  "rounded-lg border px-1 py-1 text-center text-[10px] font-bold",
                  m === 0
                    ? "border-white/10 bg-white/5 text-white/40"
                    : m >= 3
                      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                )}
              >
                {m === 0 ? "MISS" : `${m}x`}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold",
                result.won ? "text-emerald-400" : "text-rose-300/80"
              )}
            >
              {result.won && <Sparkles className="h-4 w-4" />}
              {result.won
                ? `${result.mult}x · +${formatCoins(result.payout)} TK`
                : t("No win this spin", "এই স্পিনে জয় নেই")}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={spinning}
        label={t("Spin wheel", "চাকা ঘোরান")}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
