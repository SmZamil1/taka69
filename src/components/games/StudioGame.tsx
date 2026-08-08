"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetControls } from "./BetControls";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Flame,
  Gem,
  Crown,
  Zap,
  Circle,
  Hexagon,
  Triangle,
  Square,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { sound } from "@/lib/sounds";
import Image from "next/image";

export type StudioId =
  | "buffalo"
  | "sevenup"
  | "crab"
  | "fortuneplane"
  | "dragon"
  | "candy"
  | "tiger"
  | "mermaid"
  | "frog"
  | "chili"
  | "pyramid"
  | "wolf"
  | "mahjong"
  | "minecart"
  | "roulette";

type Theme = {
  id: StudioId;
  provider: "jili" | "pg" | "spribe" | "evolution" | "fa_chai" | "jdb";
  titleEn: string;
  titleBn: string;
  cover: string;
  accent: string;
  glow: string;
  mode: "reels" | "rise" | "grid" | "wheel" | "flight";
  palette: string[];
};

const THEMES: Record<StudioId, Theme> = {
  buffalo: {
    id: "buffalo",
    provider: "jili",
    titleEn: "Thunder Buffalo",
    titleBn: "থান্ডার বাফেলো",
    cover: "/games/buffalo.jpg",
    accent: "from-amber-800 via-orange-950 to-black",
    glow: "shadow-amber-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  sevenup: {
    id: "sevenup",
    provider: "jili",
    titleEn: "Seven Rise",
    titleBn: "সেভেন রাইজ",
    cover: "/games/sevenup.jpg",
    accent: "from-rose-700 via-red-950 to-black",
    glow: "shadow-rose-500/25",
    mode: "rise",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  crab: {
    id: "crab",
    provider: "jdb",
    titleEn: "Treasure Crab",
    titleBn: "ট্রেজার ক্র্যাব",
    cover: "/games/crab.jpg",
    accent: "from-cyan-700 via-teal-950 to-black",
    glow: "shadow-cyan-500/25",
    mode: "grid",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  fortuneplane: {
    id: "fortuneplane",
    provider: "spribe",
    titleEn: "Fortune Plane",
    titleBn: "ফরচুন প্লেন",
    cover: "/games/fortuneplane.jpg",
    accent: "from-sky-700 via-indigo-950 to-black",
    glow: "shadow-sky-500/25",
    mode: "flight",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  dragon: {
    id: "dragon",
    provider: "fa_chai",
    titleEn: "Jade Dragon",
    titleBn: "জেড ড্রাগন",
    cover: "/games/dragon.jpg",
    accent: "from-emerald-700 via-green-950 to-black",
    glow: "shadow-emerald-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  candy: {
    id: "candy",
    provider: "pg",
    titleEn: "Candy Gems",
    titleBn: "ক্যান্ডি জেমস",
    cover: "/games/candy.jpg",
    accent: "from-fuchsia-700 via-purple-950 to-black",
    glow: "shadow-fuchsia-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  tiger: {
    id: "tiger",
    provider: "pg",
    titleEn: "Jungle Tiger",
    titleBn: "জঙ্গল টাইগার",
    cover: "/games/tiger.jpg",
    accent: "from-orange-700 via-yellow-950 to-black",
    glow: "shadow-orange-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  mermaid: {
    id: "mermaid",
    provider: "pg",
    titleEn: "Pearl Mermaid",
    titleBn: "পার্ল মারমেইড",
    cover: "/games/mermaid.jpg",
    accent: "from-blue-700 via-cyan-950 to-black",
    glow: "shadow-blue-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  frog: {
    id: "frog",
    provider: "jili",
    titleEn: "Lucky Frog",
    titleBn: "লাকি ফ্রগ",
    cover: "/games/frog.jpg",
    accent: "from-lime-700 via-emerald-950 to-black",
    glow: "shadow-lime-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  chili: {
    id: "chili",
    provider: "jili",
    titleEn: "Chili Fire",
    titleBn: "চিলি ফায়ার",
    cover: "/games/chili.jpg",
    accent: "from-red-700 via-orange-950 to-black",
    glow: "shadow-red-500/30",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  pyramid: {
    id: "pyramid",
    provider: "fa_chai",
    titleEn: "Scarab Gold",
    titleBn: "স্কারাব গোল্ড",
    cover: "/games/pyramid.jpg",
    accent: "from-yellow-700 via-amber-950 to-black",
    glow: "shadow-yellow-500/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  wolf: {
    id: "wolf",
    provider: "pg",
    titleEn: "Ice Wolf",
    titleBn: "আইস উল্ফ",
    cover: "/games/wolf.jpg",
    accent: "from-sky-500 via-blue-950 to-black",
    glow: "shadow-sky-400/25",
    mode: "reels",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  mahjong: {
    id: "mahjong",
    provider: "pg",
    titleEn: "Neon Mahjong",
    titleBn: "নিয়ন মাহজং",
    cover: "/games/mahjong.jpg",
    accent: "from-violet-700 via-red-950 to-black",
    glow: "shadow-violet-500/25",
    mode: "grid",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  minecart: {
    id: "minecart",
    provider: "jdb",
    titleEn: "Gem Cart",
    titleBn: "জেম কার্ট",
    cover: "/games/minecart.jpg",
    accent: "from-stone-600 via-amber-950 to-black",
    glow: "shadow-amber-600/25",
    mode: "grid",
    palette: ["A", "B", "C", "D", "E", "W"],
  },
  roulette: {
    id: "roulette",
    provider: "evolution",
    titleEn: "Cosmic Roulette",
    titleBn: "কসমিক রুলেট",
    cover: "/games/roulette.jpg",
    accent: "from-indigo-800 via-purple-950 to-black",
    glow: "shadow-indigo-500/25",
    mode: "wheel",
    palette: ["0", "1", "2", "3", "5", "10", "20", "50"],
  },
};

const ICON_MAP: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  A: { icon: Circle, color: "text-rose-300", label: "A" },
  B: { icon: Square, color: "text-amber-300", label: "B" },
  C: { icon: Triangle, color: "text-sky-300", label: "C" },
  D: { icon: Hexagon, color: "text-violet-300", label: "D" },
  E: { icon: Star, color: "text-emerald-300", label: "E" },
  W: { icon: Crown, color: "text-yellow-300", label: "W" },
};

function Cell({ sym, spinning }: { sym: string; spinning?: boolean }) {
  const meta = ICON_MAP[sym] || ICON_MAP.A;
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-2xl border border-white/12 bg-black/45 shadow-inner backdrop-blur-sm",
        spinning && "animate-pulse"
      )}
    >
      <Icon className={cn("h-8 w-8 sm:h-9 sm:w-9", meta.color)} strokeWidth={1.75} />
      <span className="absolute bottom-1 right-1.5 text-[9px] font-black text-white/35">{meta.label}</span>
    </div>
  );
}

export function StudioGame({ gameId }: { gameId: StudioId }) {
  const theme = THEMES[gameId];
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [cells, setCells] = useState(() => theme.palette.slice(0, theme.mode === "grid" ? 9 : 5));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{
    mult: number;
    payout: number;
    won: boolean;
    big?: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 2000 });
  const [flight, setFlight] = useState(1);
  const [wheelRot, setWheelRot] = useState(0);
  const [rise, setRise] = useState(0);
  const busy = useRef(false);

  const cols = theme.mode === "grid" ? 3 : theme.mode === "reels" ? 5 : 5;

  async function play() {
    if (!user || busy.current) return;
    busy.current = true;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setKey((k) => k + 1);
    setFlight(1);
    setRise(0);

    const flash = window.setInterval(() => {
      sound.spin();
      const n = theme.mode === "grid" ? 9 : 5;
      setCells(
        Array.from({ length: n }, () => theme.palette[Math.floor(Math.random() * Math.min(6, theme.palette.length))])
      );
      if (theme.mode === "flight") setFlight((f) => Math.min(25, f + 0.4 + Math.random() * 0.5));
      if (theme.mode === "rise") setRise((r) => Math.min(100, r + 10));
      if (theme.mode === "wheel") setWheelRot((r) => r + 48 + Math.random() * 24);
    }, 80);

    try {
      const res = await fetch("/api/games/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: theme.provider, amount, gameId }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, theme.mode === "flight" ? 1000 : 750));
      window.clearInterval(flash);

      if (!json.ok) {
        setError(json.error);
        sound.lose();
        toast.error(t("Play failed", "খেলতে ব্যর্থ"), json.error);
        setSpinning(false);
        busy.current = false;
        return;
      }

      const serverSyms: string[] = json.data.symbols || [];
      if (theme.mode === "grid") {
        setCells(Array.from({ length: 9 }, (_, i) => serverSyms[i % serverSyms.length] || "A"));
      } else if (theme.mode === "wheel") {
        setCells([String(json.data.multiplier || 0)]);
        setWheelRot((r) => r + 900 + Math.random() * 360);
      } else if (theme.mode === "flight") {
        setFlight(Math.max(1, Number(json.data.multiplier) || 1));
        setCells(serverSyms.slice(0, 5));
      } else if (theme.mode === "rise") {
        setRise(json.data.won ? 100 : 35 + Math.random() * 45);
        setCells(serverSyms.slice(0, 5));
      } else {
        setCells(serverSyms.slice(0, 5));
      }

      setResult({
        mult: json.data.multiplier,
        payout: json.data.payout,
        won: json.data.won,
        big: json.data.bigPrize,
      });
      setBalance(json.data.balance);
      if (json.data.limits) setLimits(json.data.limits);
      if (json.data.won) {
        sound.win();
        toast.success(
          json.data.bigPrize ? t("Big prize!", "বিগ প্রাইজ!") : t("Winner", "বিজয়ী"),
          `${json.data.multiplier}x · +${formatCoins(json.data.payout)} TK`
        );
      } else {
        sound.lose();
      }
    } catch {
      window.clearInterval(flash);
      setError("Network error");
    }
    setSpinning(false);
    busy.current = false;
  }

  const stage = useMemo(() => {
    if (theme.mode === "wheel") {
      return (
        <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
          <motion.div
            animate={{ rotate: wheelRot }}
            transition={{ type: "spring", stiffness: 36, damping: 14 }}
            className="absolute inset-0 rounded-full border-4 border-amber-300/50 shadow-inner"
            style={{
              background:
                "conic-gradient(#1e1b4b 0deg 45deg, #4c1d95 45deg 90deg, #831843 90deg 135deg, #1e3a8a 135deg 180deg, #0f172a 180deg 225deg, #312e81 225deg 270deg, #7f1d1d 270deg 315deg, #1e1b4b 315deg 360deg)",
            }}
          >
            {theme.palette.map((s, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-black text-white/85"
                style={{
                  transform: `translateX(-50%) rotate(${(360 / theme.palette.length) * i}deg)`,
                  transformOrigin: "50% 100px",
                }}
              >
                {s}
              </span>
            ))}
          </motion.div>
          <div className="z-10 rounded-full border border-white/15 bg-black/75 px-5 py-2.5 text-2xl font-black tabular-nums text-amber-300 backdrop-blur">
            {result ? `${result.mult}x` : "SPIN"}
          </div>
          <div className="absolute -top-1 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-amber-300" />
        </div>
      );
    }

    if (theme.mode === "flight") {
      return (
        <div className="relative h-52 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-950 to-black">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12), transparent 40%), radial-gradient(circle at 80% 60%, rgba(56,189,248,0.2), transparent 35%)",
            }}
          />
          <motion.div
            animate={{
              x: spinning ? [24, 160, 240] : flight > 1 ? 200 : 28,
              y: spinning ? [96, 48, 28] : flight > 1 ? 36 : 100,
              rotate: spinning ? -18 : -12,
            }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="absolute left-0 top-0 z-10"
          >
            <Plane className="h-10 w-10 text-sky-200 drop-shadow-[0_0_12px_rgba(125,211,252,0.7)]" />
          </motion.div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="text-4xl font-black tabular-nums text-white drop-shadow">{flight.toFixed(2)}x</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/70">
              Fortune Plane
            </div>
          </div>
        </div>
      );
    }

    if (theme.mode === "rise") {
      return (
        <div className="relative h-52 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-rose-950 to-black p-4">
          <div className="absolute bottom-0 left-1/2 h-full w-16 -translate-x-1/2 rounded-t-full bg-white/5" />
          <motion.div
            animate={{ height: `${Math.max(8, rise)}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            className="absolute bottom-0 left-1/2 w-14 -translate-x-1/2 rounded-t-2xl bg-gradient-to-t from-rose-600 to-amber-300 shadow-[0_0_30px_rgba(251,113,133,0.45)]"
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-between py-2">
            <div className="flex items-center gap-2 text-4xl font-black text-white drop-shadow">
              <Zap className="h-8 w-8 text-amber-300" />
              7
            </div>
            <div className="text-sm font-bold text-amber-200">
              {result ? `${result.mult}x` : t("Rise", "রাইজ")}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {cells.map((s, i) => (
          <AnimatePresence mode="popLayout" key={`${key}-${i}`}>
            <motion.div
              initial={{ y: -22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.025, duration: 0.18 }}
            >
              <Cell sym={s} spinning={spinning} />
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    );
  }, [cells, cols, flight, key, result, rise, spinning, t, theme.mode, theme.palette, wheelRot]);

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
      <div className={cn("relative overflow-hidden rounded-[1.4rem] border border-white/10", theme.glow)}>
        <div className="absolute inset-0">
          <Image src={theme.cover} alt="" fill className="object-cover opacity-30" sizes="640px" priority={false} />
          <div className={cn("absolute inset-0 bg-gradient-to-b opacity-92", theme.accent)} />
        </div>
        <div className="relative space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                {theme.provider.replace("_", " ")} studio
              </div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                {t(theme.titleEn, theme.titleBn)}
              </h2>
            </div>
            <div className="flex gap-1">
              <span className="rounded-full bg-white/10 p-1.5">
                <Gem className="h-3.5 w-3.5 text-amber-300" />
              </span>
              <span className="rounded-full bg-white/10 p-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-300" />
              </span>
              <span className="rounded-full bg-white/10 p-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-300" />
              </span>
            </div>
          </div>

          {stage}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-center text-sm font-bold backdrop-blur",
                  result.won
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-black/35 text-white/55"
                )}
              >
                {result.won && <Sparkles className="h-4 w-4" />}
                {result.won
                  ? `${result.big ? "BIG · " : ""}${result.mult}x · +${formatCoins(result.payout)} TK`
                  : t("Try again", "আবার চেষ্টা")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={spinning}
        label={
          theme.mode === "wheel"
            ? t("Spin wheel", "চাকা ঘোরান")
            : theme.mode === "flight"
              ? t("Launch", "লঞ্চ")
              : t("Spin", "স্পিন")
        }
        min={limits.minBet}
        max={limits.maxBet}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-center text-[10px] text-white/35">
        {t("Virtual TK · fair RNG · admin-capped", "ভার্চুয়াল TK · ফেয়ার RNG · অ্যাডমিন ক্যাপ")}
      </p>
    </div>
  );
}
