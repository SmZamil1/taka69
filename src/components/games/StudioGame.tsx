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
import { Sparkles, Star, Flame, Gem } from "lucide-react";
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
  symbols: string[];
  labels: Record<string, string>;
};

const THEMES: Record<StudioId, Theme> = {
  buffalo: {
    id: "buffalo",
    provider: "jili",
    titleEn: "Thunder Buffalo",
    titleBn: "থান্ডার বাফেলো",
    cover: "/games/buffalo.jpg",
    accent: "from-amber-700 via-orange-900 to-black",
    glow: "shadow-amber-500/30",
    mode: "reels",
    symbols: ["🐃", "⚡", "🪙", "🌵", "🔔", "💎"],
    labels: { "🐃": "Buffalo", "⚡": "Thunder", "🪙": "Coin", "🌵": "Cactus", "🔔": "Bell", "💎": "Gem" },
  },
  sevenup: {
    id: "sevenup",
    provider: "jili",
    titleEn: "Seven Rise",
    titleBn: "সেভেন রাইজ",
    cover: "/games/sevenup.jpg",
    accent: "from-rose-600 via-red-900 to-black",
    glow: "shadow-rose-500/30",
    mode: "rise",
    symbols: ["7", "★", "BAR", "🔔", "🍒", "💎"],
    labels: {},
  },
  crab: {
    id: "crab",
    provider: "jdb",
    titleEn: "Treasure Crab",
    titleBn: "ট্রেজার ক্র্যাব",
    cover: "/games/crab.jpg",
    accent: "from-cyan-600 via-teal-900 to-black",
    glow: "shadow-cyan-500/30",
    mode: "grid",
    symbols: ["🦀", "🐚", "🪙", "⚓", "💎", "🌊"],
    labels: {},
  },
  fortuneplane: {
    id: "fortuneplane",
    provider: "spribe",
    titleEn: "Fortune Plane",
    titleBn: "ফরচুন প্লেন",
    cover: "/games/fortuneplane.jpg",
    accent: "from-sky-600 via-indigo-900 to-black",
    glow: "shadow-sky-500/30",
    mode: "flight",
    symbols: ["✈", "☁", "⭐", "💎", "🪙", "🔥"],
    labels: {},
  },
  dragon: {
    id: "dragon",
    provider: "fa_chai",
    titleEn: "Jade Dragon",
    titleBn: "জেড ড্রাগন",
    cover: "/games/dragon.jpg",
    accent: "from-emerald-600 via-green-950 to-black",
    glow: "shadow-emerald-500/30",
    mode: "reels",
    symbols: ["🐉", "jade", "🪙", "🧧", "🔥", "💎"],
    labels: { jade: "Jade" },
  },
  candy: {
    id: "candy",
    provider: "pg",
    titleEn: "Candy Gems",
    titleBn: "ক্যান্ডি জেমস",
    cover: "/games/candy.jpg",
    accent: "from-fuchsia-600 via-purple-900 to-black",
    glow: "shadow-fuchsia-500/30",
    mode: "reels",
    symbols: ["🍬", "🍭", "⭐", "💜", "💚", "💎"],
    labels: {},
  },
  tiger: {
    id: "tiger",
    provider: "pg",
    titleEn: "Jungle Tiger",
    titleBn: "জঙ্গল টাইগার",
    cover: "/games/tiger.jpg",
    accent: "from-orange-600 via-yellow-900 to-black",
    glow: "shadow-orange-500/30",
    mode: "reels",
    symbols: ["🐯", "🍃", "🪙", "🔥", "💎", "🌙"],
    labels: {},
  },
  mermaid: {
    id: "mermaid",
    provider: "pg",
    titleEn: "Pearl Mermaid",
    titleBn: "পার্ল মারমেইড",
    cover: "/games/mermaid.jpg",
    accent: "from-blue-600 via-cyan-900 to-black",
    glow: "shadow-blue-500/30",
    mode: "reels",
    symbols: ["🧜‍♀️", "pearl", "🐠", "🐚", "💎", "🌊"],
    labels: { pearl: "Pearl" },
  },
  frog: {
    id: "frog",
    provider: "jili",
    titleEn: "Lucky Frog",
    titleBn: "লাকি ফ্রগ",
    cover: "/games/frog.jpg",
    accent: "from-lime-600 via-emerald-900 to-black",
    glow: "shadow-lime-500/30",
    mode: "reels",
    symbols: ["🐸", "🪙", "🪷", "💎", "⭐", "💰"],
    labels: {},
  },
  chili: {
    id: "chili",
    provider: "jili",
    titleEn: "Chili Fire",
    titleBn: "চিলি ফায়ার",
    cover: "/games/chili.jpg",
    accent: "from-red-600 via-orange-900 to-black",
    glow: "shadow-red-500/40",
    mode: "reels",
    symbols: ["🌶️", "🔥", "🪙", "💥", "💎", "🔔"],
    labels: {},
  },
  pyramid: {
    id: "pyramid",
    provider: "fa_chai",
    titleEn: "Scarab Gold",
    titleBn: "স্কারাব গোল্ড",
    cover: "/games/pyramid.jpg",
    accent: "from-yellow-600 via-amber-900 to-black",
    glow: "shadow-yellow-500/30",
    mode: "reels",
    symbols: ["🪲", "🔺", "🪙", "👁️", "💎", "☀️"],
    labels: {},
  },
  wolf: {
    id: "wolf",
    provider: "pg",
    titleEn: "Ice Wolf",
    titleBn: "আইস উল্ফ",
    cover: "/games/wolf.jpg",
    accent: "from-sky-400 via-blue-950 to-black",
    glow: "shadow-sky-400/30",
    mode: "reels",
    symbols: ["🐺", "❄️", "🪙", "🌙", "💎", "⭐"],
    labels: {},
  },
  mahjong: {
    id: "mahjong",
    provider: "pg",
    titleEn: "Neon Mahjong",
    titleBn: "নিয়ন মাহজং",
    cover: "/games/mahjong.jpg",
    accent: "from-violet-600 via-red-950 to-black",
    glow: "shadow-violet-500/30",
    mode: "grid",
    symbols: ["中", "發", "白", "東", "南", "💎"],
    labels: {},
  },
  minecart: {
    id: "minecart",
    provider: "jdb",
    titleEn: "Gem Cart",
    titleBn: "জেম কার্ট",
    cover: "/games/minecart.jpg",
    accent: "from-stone-500 via-amber-950 to-black",
    glow: "shadow-amber-600/30",
    mode: "grid",
    symbols: ["🛒", "💎", "🪙", "⛏️", "💚", "❤️"],
    labels: {},
  },
  roulette: {
    id: "roulette",
    provider: "evolution",
    titleEn: "Cosmic Roulette",
    titleBn: "কসমিক রুলেট",
    cover: "/games/roulette.jpg",
    accent: "from-indigo-700 via-purple-950 to-black",
    glow: "shadow-indigo-500/30",
    mode: "wheel",
    symbols: ["0", "1", "2", "3", "5", "10", "20", "50"],
    labels: {},
  },
};

function mapServerSymbols(server: string[], theme: Theme): string[] {
  return server.map((s, i) => theme.symbols[i % theme.symbols.length] || theme.symbols[0]);
}

export function StudioGame({ gameId }: { gameId: StudioId }) {
  const theme = THEMES[gameId];
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [cells, setCells] = useState(() => theme.symbols.slice(0, theme.mode === "grid" ? 9 : 5));
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

  const cols = theme.mode === "grid" ? 3 : theme.mode === "reels" ? 5 : theme.mode === "wheel" ? 1 : 5;

  async function play() {
    if (!user) return;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setKey((k) => k + 1);
    setFlight(1);
    setRise(0);

    const flash = setInterval(() => {
      sound.spin();
      setCells(
        Array.from({ length: theme.mode === "grid" ? 9 : 5 }, () => {
          return theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
        })
      );
      if (theme.mode === "flight") setFlight((f) => Math.min(20, f + 0.35 + Math.random()));
      if (theme.mode === "rise") setRise((r) => Math.min(100, r + 8));
      if (theme.mode === "wheel") setWheelRot((r) => r + 40 + Math.random() * 20);
    }, 70);

    try {
      const res = await fetch("/api/games/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: theme.provider, amount, gameId }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, theme.mode === "flight" ? 1100 : 800));
      clearInterval(flash);

      if (!json.ok) {
        setError(json.error);
        sound.lose();
        toast.error(t("Play failed", "খেলতে ব্যর্থ"), json.error);
        setSpinning(false);
        return;
      }

      const mapped = mapServerSymbols(json.data.symbols || [], theme);
      if (theme.mode === "grid") {
        setCells(
          Array.from({ length: 9 }, (_, i) => mapped[i % mapped.length] || theme.symbols[i % theme.symbols.length])
        );
      } else if (theme.mode === "wheel") {
        setCells([String(json.data.multiplier || 0)]);
        setWheelRot((r) => r + 720 + Math.random() * 360);
      } else if (theme.mode === "flight") {
        setFlight(Math.max(1, json.data.multiplier || 1));
        setCells(mapped.slice(0, 5));
      } else if (theme.mode === "rise") {
        setRise(json.data.won ? 100 : 40 + Math.random() * 40);
        setCells(mapped.slice(0, 5));
      } else {
        setCells(mapped.slice(0, 5));
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
      clearInterval(flash);
      setError("Network error");
    }
    setSpinning(false);
  }

  const stage = useMemo(() => {
    if (theme.mode === "wheel") {
      return (
        <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
          <motion.div
            animate={{ rotate: wheelRot }}
            transition={{ type: "spring", stiffness: 40, damping: 12 }}
            className="absolute inset-0 rounded-full border-4 border-amber-300/60 bg-[conic-gradient(at_center,_#1e1b4b,_#4c1d95,_#831843,_#1e3a8a,_#1e1b4b)] shadow-inner"
          >
            {theme.symbols.map((s, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] font-black text-white/80"
                style={{ transform: `translateX(-50%) rotate(${(360 / theme.symbols.length) * i}deg)`, transformOrigin: "50% 92px" }}
              >
                {s}
              </span>
            ))}
          </motion.div>
          <div className="z-10 rounded-full bg-black/70 px-4 py-2 text-2xl font-black text-amber-300 backdrop-blur">
            {result ? `${result.mult}x` : "spin"}
          </div>
          <div className="absolute -top-1 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-amber-300" />
        </div>
      );
    }

    if (theme.mode === "flight") {
      return (
        <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-900/80 to-black">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff3, transparent 40%), radial-gradient(circle at 80% 60%, #67e8f955, transparent 35%)" }} />
          <motion.div
            animate={{ x: spinning ? [20, 180, 260] : flight > 1 ? 200 : 24, y: spinning ? [80, 40, 20] : flight > 1 ? 30 : 90 }}
            transition={{ duration: 0.9 }}
            className="absolute text-4xl"
          >
            ✈️
          </motion.div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="text-4xl font-black tabular-nums text-white drop-shadow">{flight.toFixed(2)}x</div>
            <div className="text-[10px] uppercase tracking-widest text-sky-200/70">Fortune Plane</div>
          </div>
        </div>
      );
    }

    if (theme.mode === "rise") {
      return (
        <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-rose-950 to-black p-4">
          <div className="absolute bottom-0 left-1/2 h-full w-16 -translate-x-1/2 rounded-t-full bg-white/5" />
          <motion.div
            animate={{ height: `${Math.max(8, rise)}%` }}
            className="absolute bottom-0 left-1/2 w-14 -translate-x-1/2 rounded-t-2xl bg-gradient-to-t from-rose-600 to-amber-300 shadow-[0_0_30px_rgba(251,113,133,0.5)]"
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-between py-2">
            <div className="text-5xl font-black text-white drop-shadow">7</div>
            <div className="text-sm font-bold text-amber-200">{result ? `${result.mult}x` : t("Rise", "রাইজ")}</div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {cells.map((s, i) => (
          <AnimatePresence mode="popLayout" key={`${key}-${i}`}>
            <motion.div
              initial={{ y: -28, opacity: 0, rotateX: 40 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl border border-white/15 bg-black/35 text-2xl font-black text-white shadow-inner backdrop-blur-sm",
                spinning && "animate-pulse"
              )}
            >
              {s === "jade" ? "🟢" : s === "pearl" ? "🤍" : s}
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    );
  }, [cells, cols, flight, key, result, rise, spinning, t, theme.mode, theme.symbols, wheelRot]);

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
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="absolute inset-0">
          <Image src={theme.cover} alt="" fill className="object-cover opacity-35" sizes="600px" />
          <div className={cn("absolute inset-0 bg-gradient-to-b", theme.accent, "opacity-90")} />
        </div>
        <div className={cn("relative space-y-4 p-4 sm:p-5", theme.glow)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                {theme.provider.replace("_", " ")} · studio
              </div>
              <h2 className="text-xl font-black text-white sm:text-2xl">{t(theme.titleEn, theme.titleBn)}</h2>
            </div>
            <div className="flex gap-1">
              <span className="rounded-full bg-white/10 p-1.5"><Gem className="h-3.5 w-3.5 text-amber-300" /></span>
              <span className="rounded-full bg-white/10 p-1.5"><Flame className="h-3.5 w-3.5 text-orange-300" /></span>
              <span className="rounded-full bg-white/10 p-1.5"><Star className="h-3.5 w-3.5 text-yellow-300" /></span>
            </div>
          </div>

          {stage}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2 text-center text-sm font-bold backdrop-blur",
                  result.won
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-black/30 text-white/60"
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
      <p className="text-center text-[10px] text-emerald-200/40">
        {t("Virtual TK · fair RNG · themed studio original", "ভার্চুয়াল TK · ফেয়ার RNG · থিমড স্টুডিও অরিজিনাল")}
      </p>
    </div>
  );
}
