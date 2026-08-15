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
  Bomb,
  Target,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { sound } from "@/lib/sounds";

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
  | "roulette"
  | "baccarat";

type Mode = "reels3" | "reels5" | "rise" | "pick" | "flight" | "match" | "wheel" | "hold";

type Theme = {
  id: StudioId;
  provider: string;
  titleEn: string;
  titleBn: string;
  cover: string;
  accent: string;
  frame: string;
  mode: Mode;
  howEn: string;
  howBn: string;
  labels: string[];
};

const THEMES: Record<StudioId, Theme> = {
  buffalo: {
    id: "buffalo", provider: "JILI", titleEn: "Thunder Buffalo", titleBn: "থান্ডার বাফেলো",
    cover: "/games/buffalo.jpg", accent: "from-[#3b1d0b] via-[#1a0c04] to-black", frame: "border-amber-500/40",
    mode: "reels5", howEn: "5-reel storm spin · wilds pay more", howBn: "৫-রিল স্টর্ম স্পিন · ওয়াইল্ডে বেশি",
    labels: ["BUFF", "BOLT", "COIN", "HORN", "WILD"],
  },
  sevenup: {
    id: "sevenup", provider: "JILI", titleEn: "Seven Rise", titleBn: "সেভেন রাইজ",
    cover: "/games/sevenup.jpg", accent: "from-[#4c0519] via-[#1f0208] to-black", frame: "border-rose-400/40",
    mode: "rise", howEn: "Climb the 7 tower · cash before drop", howBn: "৭ টাওয়ার উঠান · ড্রপের আগে ক্যাশ",
    labels: ["1","2","3","5","7"],
  },
  crab: {
    id: "crab", provider: "JDB", titleEn: "Treasure Crab", titleBn: "ট্রেজার ক্র্যাব",
    cover: "/games/crab.jpg", accent: "from-[#083344] via-[#042f2e] to-black", frame: "border-cyan-400/40",
    mode: "pick", howEn: "Pick 3 shells · find the pearl", howBn: "৩টি শেল বাছুন · পার্ল খুঁজুন",
    labels: ["SHELL","PEARL","COIN","TRAP","GEM"],
  },
  fortuneplane: {
    id: "fortuneplane", provider: "SPRIBE", titleEn: "Fortune Plane", titleBn: "ফরচুন প্লেন",
    cover: "/games/fortuneplane.jpg", accent: "from-[#0c4a6e] via-[#082f49] to-black", frame: "border-sky-400/40",
    mode: "flight", howEn: "Launch curve · auto settle at mult", howBn: "কার্ভ লঞ্চ · মাল্টিতে অটো সেটেল",
    labels: ["x1","x2","x5","x10","x20"],
  },
  dragon: {
    id: "dragon", provider: "FA CHAI", titleEn: "Jade Dragon", titleBn: "জেড ড্রাগন",
    cover: "/games/dragon.jpg", accent: "from-[#052e16] via-[#022c22] to-black", frame: "border-emerald-400/40",
    mode: "hold", howEn: "Hold & spin jade coins", howBn: "জেড কয়েন হোল্ড অ্যান্ড স্পিন",
    labels: ["JADE","COIN","FIRE","DRAG","WILD"],
  },
  candy: {
    id: "candy", provider: "PG", titleEn: "Candy Gems", titleBn: "ক্যান্ডি জেমস",
    cover: "/games/candy.jpg", accent: "from-[#4a044e] via-[#2e1065] to-black", frame: "border-fuchsia-400/40",
    mode: "match", howEn: "Match-3 cascade sweets", howBn: "ম্যাচ-৩ ক্যান্ডি ক্যাসকেড",
    labels: ["PINK","BLUE","LIME","STAR","BOMB"],
  },
  tiger: {
    id: "tiger", provider: "PG", titleEn: "Jungle Tiger", titleBn: "জঙ্গল টাইগার",
    cover: "/games/tiger.jpg", accent: "from-[#431407] via-[#1c1917] to-black", frame: "border-orange-400/40",
    mode: "reels3", howEn: "3-reel classic jungle pay", howBn: "৩-রিল ক্লাসিক জঙ্গল পে",
    labels: ["TIGER","LEAF","COIN","MOON","WILD"],
  },
  mermaid: {
    id: "mermaid", provider: "PG", titleEn: "Pearl Mermaid", titleBn: "পার্ল মারমেইড",
    cover: "/games/mermaid.jpg", accent: "from-[#0c4a6e] via-[#164e63] to-black", frame: "border-blue-300/40",
    mode: "reels5", howEn: "Ocean reels · pearl scatter", howBn: "ওশান রিল · পার্ল স্ক্যাটার",
    labels: ["PEARL","FISH","SHELL","WAVE","WILD"],
  },
  frog: {
    id: "frog", provider: "JILI", titleEn: "Lucky Frog", titleBn: "লাকি ফ্রগ",
    cover: "/games/frog.jpg", accent: "from-[#14532d] via-[#052e16] to-black", frame: "border-lime-400/40",
    mode: "pick", howEn: "Tap lily pads for coins", howBn: "লিলি প্যাডে ট্যাপ করে কয়েন",
    labels: ["PAD","COIN","FLY","GOLD","TRAP"],
  },
  chili: {
    id: "chili", provider: "JILI", titleEn: "Chili Fire", titleBn: "চিলি ফায়ার",
    cover: "/games/chili.jpg", accent: "from-[#7f1d1d] via-[#450a0a] to-black", frame: "border-red-400/40",
    mode: "reels3", howEn: "Hot reels · fire multipliers", howBn: "হট রিল · ফায়ার মাল্টিপ্লায়ার",
    labels: ["CHILI","FIRE","BELL","STAR","WILD"],
  },
  pyramid: {
    id: "pyramid", provider: "FA CHAI", titleEn: "Scarab Gold", titleBn: "স্কারাব গোল্ড",
    cover: "/games/pyramid.jpg", accent: "from-[#78350f] via-[#451a03] to-black", frame: "border-yellow-400/40",
    mode: "hold", howEn: "Collect scarabs · unlock tomb", howBn: "স্কারাব সংগ্রহ · টুম্ব আনলক",
    labels: ["SCARAB","ANKH","GOLD","EYE","WILD"],
  },
  wolf: {
    id: "wolf", provider: "PG", titleEn: "Ice Wolf", titleBn: "আইস উল্ফ",
    cover: "/games/wolf.jpg", accent: "from-[#0f172a] via-[#082f49] to-black", frame: "border-sky-300/40",
    mode: "reels5", howEn: "Frozen wilds expand", howBn: "ফ্রোজেন ওয়াইল্ড এক্সপ্যান্ড",
    labels: ["WOLF","ICE","MOON","SNOW","WILD"],
  },
  mahjong: {
    id: "mahjong", provider: "PG", titleEn: "Neon Mahjong", titleBn: "নিয়ন মাহজং",
    cover: "/games/mahjong.jpg", accent: "from-[#4c1d95] via-[#3b0764] to-black", frame: "border-violet-400/40",
    mode: "match", howEn: "Pair tiles · chain neon wins", howBn: "টাইল পেয়ার · নিয়ন চেইন উইন",
    labels: ["東","南","西","北","中","發"],
  },
  minecart: {
    id: "minecart", provider: "JDB", titleEn: "Gem Cart", titleBn: "জেম কার্ট",
    cover: "/games/minecart.jpg", accent: "from-[#292524] via-[#1c1917] to-black", frame: "border-amber-600/40",
    mode: "pick", howEn: "Open carts · dodge rocks", howBn: "কার্ট খুলুন · পাথর এড়ান",
    labels: ["GEM","GOLD","ROCK","CART","RUBY"],
  },
  roulette: {
    id: "roulette", provider: "EVOLUTION", titleEn: "Cosmic Roulette", titleBn: "কসমিক রুলেট",
    cover: "/games/roulette.jpg", accent: "from-[#1e1b4b] via-[#0f172a] to-black", frame: "border-indigo-400/40",
    mode: "wheel", howEn: "Cosmic wheel · pocket prizes", howBn: "কসমিক চাকা · পকেট প্রাইজ",
    labels: ["0","1","2","5","10","20","50"],
  },
  baccarat: {
    id: "baccarat", provider: "EVOLUTION", titleEn: "Live Baccarat", titleBn: "লাইভ বাকারা",
    cover: "/games/baccarat.jpg", accent: "from-[#064e3b] via-[#022c22] to-black", frame: "border-emerald-400/40",
    mode: "match", howEn: "Player vs Banker · classic live table", howBn: "প্লেয়ার বনাম ব্যাংকার · ক্লাসিক লাইভ টেবিল",
    labels: ["P","B","T","C","A"],
  },
};

const ICONS: LucideIcon[] = [Circle, Square, Triangle, Hexagon, Star, Crown, Gem, Flame, Zap, Coins, Target, Bomb];

function Tile({ label, i, big=false }: { label: string; i: number; big?: boolean }) {
  const Icon = ICONS[i % ICONS.length];
  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-black/45 shadow-inner backdrop-blur-sm",
      big ? "aspect-[3/4] p-2" : "aspect-square p-1.5"
    )}>
      <Icon className={cn(big ? "h-9 w-9" : "h-7 w-7", "text-amber-200")} strokeWidth={1.7} />
      <span className="mt-1 text-[9px] font-black tracking-wide text-white/70">{label}</span>
    </div>
  );
}


function toProviderCode(p: string) {
  const s = p.toLowerCase().replace(/\s+/g, "_");
  if (s === "fa_chai" || s.includes("fa_chai") || s.includes("fa-chai")) return "fa_chai";
  if (s.includes("jili")) return "jili";
  if (s === "pg") return "pg";
  if (s.includes("spribe")) return "spribe";
  if (s.includes("evolution")) return "evolution";
  if (s.includes("jdb")) return "jdb";
  return "jili";
}

export function StudioGame({ gameId }: { gameId: StudioId }) {
  const theme = THEMES[gameId];
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [cells, setCells] = useState(() => theme.labels.slice(0, theme.mode === "match" || theme.mode === "pick" ? 9 : theme.mode === "reels5" ? 5 : 3));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean; big?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 2000 });
  const [flight, setFlight] = useState(1);
  const [rise, setRise] = useState(0);
  const [wheelRot, setWheelRot] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [holdMask, setHoldMask] = useState<boolean[]>([]);
  const busy = useRef(false);

  async function play(extra?: { pickIndex?: number }) {
    if (!user || busy.current) return;
    if (theme.mode === "pick" && extra?.pickIndex == null && picks.length < 1 && !spinning) {
      // wait for picks
    }
    busy.current = true;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setKey((k) => k + 1);
    setFlight(1);
    setRise(0);

    const n =
      theme.mode === "match" || theme.mode === "pick" ? 9 :
      theme.mode === "reels5" || theme.mode === "hold" ? 5 :
      theme.mode === "reels3" ? 3 : 5;

    const flash = window.setInterval(() => {
      sound.spin();
      setCells(Array.from({ length: n }, () => theme.labels[Math.floor(Math.random() * theme.labels.length)]));
      if (theme.mode === "flight") setFlight((f) => Math.min(40, f + 0.55 + Math.random()));
      if (theme.mode === "rise") setRise((r) => Math.min(100, r + 12));
      if (theme.mode === "wheel") setWheelRot((r) => r + 50 + Math.random() * 30);
    }, 75);

    try {
      const res = await fetch("/api/games/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: toProviderCode(theme.provider), amount }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, theme.mode === "flight" ? 1100 : 800));
      window.clearInterval(flash);

      if (!json.ok) {
        setError(json.error || "Play failed");
        sound.lose();
        toast.error(t("Play failed", "খেলতে ব্যর্থ"), json.error);
        setSpinning(false);
        busy.current = false;
        return;
      }

      const serverSyms: string[] = json.data.symbols || [];
      const mapped = Array.from({ length: n }, (_, i) => theme.labels[i % theme.labels.length]);
      // blend server randomness into labels
      for (let i = 0; i < n; i++) {
        const code = serverSyms[i % serverSyms.length] || "A";
        const idx = (code.charCodeAt(0) + i) % theme.labels.length;
        mapped[i] = theme.labels[idx];
      }
      if (theme.mode === "wheel") {
        setWheelRot((r) => r + 1080 + Math.random() * 360);
        setCells([String(json.data.multiplier || 0)]);
      } else if (theme.mode === "flight") {
        setFlight(Math.max(1, Number(json.data.multiplier) || 1));
        setCells(mapped.slice(0, 5));
      } else if (theme.mode === "rise") {
        setRise(json.data.won ? 100 : 30 + Math.random() * 50);
        setCells(mapped.slice(0, 5));
      } else if (theme.mode === "hold") {
        setHoldMask(mapped.map((_, i) => i < 2));
        setCells(mapped);
      } else {
        setCells(mapped);
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
      } else sound.lose();
    } catch {
      window.clearInterval(flash);
      setError("Network error");
    }
    setSpinning(false);
    busy.current = false;
    setPicks([]);
  }

  const stage = useMemo(() => {
    if (theme.mode === "wheel") {
      return (
        <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
          <motion.div animate={{ rotate: wheelRot }} transition={{ type: "spring", stiffness: 30, damping: 14 }}
            className="absolute inset-0 rounded-full border-4 border-indigo-300/50"
            style={{ background: "conic-gradient(#1e1b4b,#4c1d95,#831843,#1e3a8a,#0f172a,#312e81,#7f1d1d,#1e1b4b)" }} />
          <div className="z-10 rounded-full border border-white/20 bg-black/75 px-5 py-2.5 text-2xl font-black tabular-nums text-amber-300">
            {result ? `${result.mult}x` : "SPIN"}
          </div>
          <div className="absolute -top-1 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-amber-300" />
        </div>
      );
    }
    if (theme.mode === "flight") {
      return (
        <div className="relative h-52 overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-950 to-black">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(125,211,252,.2), transparent 40%)" }} />
          <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={`M5 90 Q 40 ${90 - Math.min(70, flight * 3)} 95 ${90 - Math.min(75, flight * 3.2)}`} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          </svg>
          <motion.div animate={{ x: spinning ? [20, 170, 240] : flight > 1 ? 210 : 24, y: spinning ? [100, 50, 28] : flight > 1 ? 34 : 110, rotate: -14 }}
            transition={{ duration: 0.9 }} className="absolute left-0 top-0 z-10">
            <Plane className="h-10 w-10 text-sky-200 drop-shadow-[0_0_12px_rgba(125,211,252,0.8)]" />
          </motion.div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="text-4xl font-black tabular-nums text-white">{flight.toFixed(2)}x</div>
          </div>
        </div>
      );
    }
    if (theme.mode === "rise") {
      return (
        <div className="relative h-52 overflow-hidden rounded-2xl border border-rose-400/20 bg-gradient-to-b from-rose-950 to-black p-4">
          <motion.div animate={{ height: `${Math.max(8, rise)}%` }} className="absolute bottom-0 left-1/2 w-16 -translate-x-1/2 rounded-t-2xl bg-gradient-to-t from-rose-600 to-amber-300 shadow-[0_0_30px_rgba(251,113,133,.5)]" />
          <div className="relative z-10 flex h-full flex-col items-center justify-between py-2">
            <div className="flex items-center gap-2 text-5xl font-black text-white"><Zap className="h-8 w-8 text-amber-300" />7</div>
            <div className="text-sm font-bold text-amber-200">{result ? `${result.mult}x` : t("Rise", "রাইজ")}</div>
          </div>
        </div>
      );
    }
    if (theme.mode === "pick") {
      return (
        <div className="grid grid-cols-3 gap-2">
          {cells.map((label, i) => (
            <button key={`${key}-${i}`} type="button" disabled={spinning}
              onClick={() => {
                if (spinning || busy.current) return;
                setPicks([i]);
                void play({ pickIndex: i });
              }}
              className={cn("rounded-2xl border p-1 transition", picks.includes(i) ? "border-amber-300 bg-amber-400/10" : "border-white/10 bg-black/30")}>
              <Tile label={label} i={i} />
            </button>
          ))}
        </div>
      );
    }
    if (theme.mode === "match") {
      return (
        <div className="grid grid-cols-3 gap-2">
          {cells.map((label, i) => (
            <motion.div key={`${key}-${i}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.03 }}>
              <Tile label={label} i={i} />
            </motion.div>
          ))}
        </div>
      );
    }
    // reels / hold
    const cols = theme.mode === "reels3" ? 3 : 5;
    return (
      <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {cells.map((label, i) => (
          <AnimatePresence mode="popLayout" key={`${key}-${i}`}>
            <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <div className={cn(holdMask[i] && "ring-2 ring-amber-300/70 rounded-2xl")}> 
                <Tile label={label} i={i} big={cols === 3} />
              </div>
            </motion.div>
          </AnimatePresence>
        ))}
      </div>
    );
  }, [cells, flight, key, picks, result, rise, spinning, t, theme.mode, wheelRot, holdMask]);

  if (!user) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  const providerCode = theme.provider;

  return (
    <div className="space-y-4">
      <div className={cn("relative overflow-hidden rounded-[1.5rem] border", theme.frame)}>
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.cover} alt="" className="h-full w-full object-cover opacity-35" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className={cn("absolute inset-0 bg-gradient-to-b opacity-95", theme.accent)} />
        </div>
        <div className="relative space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">{providerCode} · {theme.mode}</div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{t(theme.titleEn, theme.titleBn)}</h2>
              <p className="mt-1 text-xs text-white/65">{t(theme.howEn, theme.howBn)}</p>
            </div>
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/20 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={theme.cover} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
          {stage}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-center text-sm font-bold backdrop-blur",
                  result.won ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-black/35 text-white/55")}>
                {result.won && <Sparkles className="h-4 w-4" />}
                {result.won ? `${result.big ? "BIG · " : ""}${result.mult}x · +${formatCoins(result.payout)} TK` : t("Try again", "আবার চেষ্টা")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {theme.mode !== "pick" && (
        <BetControls
          amount={amount}
          setAmount={setAmount}
          onBet={() => play()}
          disabled={spinning}
          label={theme.mode === "wheel" ? t("Spin wheel", "চাকা ঘোরান") : theme.mode === "flight" ? t("Launch", "লঞ্চ") : theme.mode === "rise" ? t("Climb", "উঠান") : t("Play", "খেলুন")}
          min={limits.minBet}
          max={limits.maxBet}
        />
      )}
      {theme.mode === "pick" && (
        <div className="space-y-2">
          <BetControls amount={amount} setAmount={setAmount} onBet={() => play()} disabled={spinning} label={t("Auto pick", "অটো পিক")} min={limits.minBet} max={limits.maxBet} />
          <p className="text-center text-[11px] text-white/45">{t("Or tap tiles above", "অথবা উপরের টাইল ট্যাপ করুন")}</p>
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
