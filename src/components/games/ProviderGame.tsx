"use client";

import { useRef, useState } from "react";
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
  LayoutGrid,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Star,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { sound } from "@/lib/sounds";

const META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  A: { icon: Circle, color: "text-rose-200", bg: "from-rose-600 to-rose-900" },
  B: { icon: Square, color: "text-amber-100", bg: "from-amber-500 to-orange-800" },
  C: { icon: Triangle, color: "text-sky-100", bg: "from-sky-500 to-blue-900" },
  D: { icon: Hexagon, color: "text-emerald-100", bg: "from-emerald-500 to-teal-900" },
  E: { icon: Star, color: "text-violet-100", bg: "from-violet-500 to-purple-900" },
  W: { icon: Crown, color: "text-yellow-100", bg: "from-yellow-400 to-amber-700" },
};

type HubGame = { href: string; en: string; bn: string; cover: string };

const HUB: Record<string, {
  accent: string;
  frame: string;
  blurbEn: string;
  blurbBn: string;
  games: HubGame[];
}> = {
  jili: {
    accent: "from-orange-950 via-amber-950 to-black",
    frame: "border-amber-400/35",
    blurbEn: "Hot Asian slots · storm wilds",
    blurbBn: "হট এশিয়ান স্লট · স্টর্ম ওয়াইল্ড",
    games: [
      { href: "/games/buffalo", en: "Thunder Buffalo", bn: "থান্ডার বাফেলো", cover: "/games/buffalo.jpg" },
      { href: "/games/sevenup", en: "Seven Rise", bn: "সেভেন রাইজ", cover: "/games/sevenup.jpg" },
      { href: "/games/frog", en: "Lucky Frog", bn: "লাকি ফ্রগ", cover: "/games/frog.jpg" },
      { href: "/games/chili", en: "Chili Fire", bn: "চিলি ফায়ার", cover: "/games/chili.jpg" },
    ],
  },
  pg: {
    accent: "from-fuchsia-950 via-purple-950 to-black",
    frame: "border-fuchsia-400/35",
    blurbEn: "Premium cascade & jungle titles",
    blurbBn: "প্রিমিয়াম ক্যাসকেড ও জঙ্গল",
    games: [
      { href: "/games/candy", en: "Candy Gems", bn: "ক্যান্ডি জেমস", cover: "/games/candy.jpg" },
      { href: "/games/tiger", en: "Jungle Tiger", bn: "জঙ্গল টাইগার", cover: "/games/tiger.jpg" },
      { href: "/games/mermaid", en: "Pearl Mermaid", bn: "পার্ল মারমেইড", cover: "/games/mermaid.jpg" },
      { href: "/games/wolf", en: "Ice Wolf", bn: "আইস উল্ফ", cover: "/games/wolf.jpg" },
      { href: "/games/mahjong", en: "Neon Mahjong", bn: "নিয়ন মাহজং", cover: "/games/mahjong.jpg" },
    ],
  },
  spribe: {
    accent: "from-sky-950 via-indigo-950 to-black",
    frame: "border-sky-400/35",
    blurbEn: "Crash & instant skill games",
    blurbBn: "ক্র্যাশ ও ইনস্ট্যান্ট স্কিল গেম",
    games: [
      { href: "/games/crash", en: "Aviator", bn: "এভিয়েটর", cover: "/games/crash.jpg" },
      { href: "/games/fortuneplane", en: "Fortune Plane", bn: "ফরচুন প্লেন", cover: "/games/fortuneplane.jpg" },
      { href: "/games/mines", en: "Mines", bn: "মাইন্স", cover: "/games/mines.jpg" },
      { href: "/games/plinko", en: "Plinko", bn: "প্লিঙ্কো", cover: "/games/plinko.jpg" },
    ],
  },
  evolution: {
    accent: "from-indigo-950 via-slate-950 to-black",
    frame: "border-indigo-400/35",
    blurbEn: "Live-style table & cosmic wheel",
    blurbBn: "লাইভ-স্টাইল টেবিল ও কসমিক হুইল",
    games: [
      { href: "/games/roulette", en: "Cosmic Roulette", bn: "কসমিক রুলেট", cover: "/games/roulette.jpg" },
      { href: "/games/wheel", en: "Fortune Wheel", bn: "ফরচুন হুইল", cover: "/games/wheel.jpg" },
    ],
  },
  fa_chai: {
    accent: "from-emerald-950 via-green-950 to-black",
    frame: "border-emerald-400/35",
    blurbEn: "Jade dragons & scarab gold",
    blurbBn: "জেড ড্রাগন ও স্কারাব গোল্ড",
    games: [
      { href: "/games/dragon", en: "Jade Dragon", bn: "জেড ড্রাগন", cover: "/games/dragon.jpg" },
      { href: "/games/pyramid", en: "Scarab Gold", bn: "স্কারাব গোল্ড", cover: "/games/pyramid.jpg" },
    ],
  },
  jdb: {
    accent: "from-cyan-950 via-teal-950 to-black",
    frame: "border-cyan-400/35",
    blurbEn: "Arcade treasure pick games",
    blurbBn: "আর্কেড ট্রেজার পিক গেম",
    games: [
      { href: "/games/crab", en: "Treasure Crab", bn: "ট্রেজার ক্র্যাব", cover: "/games/crab.jpg" },
      { href: "/games/minecart", en: "Gem Cart", bn: "জেম কার্ট", cover: "/games/minecart.jpg" },
    ],
  },
};

export function ProviderGame({
  provider,
  titleEn,
  titleBn,
}: {
  provider: "jili" | "pg" | "spribe" | "evolution" | "fa_chai" | "jdb";
  titleEn: string;
  titleBn: string;
}) {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [amount, setAmount] = useState(10);
  const [symbols, setSymbols] = useState(["A", "B", "C", "D", "E"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ mult: number; payout: number; won: boolean; big?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [key, setKey] = useState(0);
  const [limits, setLimits] = useState({ minBet: 10, maxBet: 2000 });
  const busy = useRef(false);
  const hub = HUB[provider];

  async function play() {
    if (!user || busy.current) return;
    busy.current = true;
    await sound.unlock();
    sound.bet();
    setSpinning(true);
    setError("");
    setResult(null);
    setKey((k) => k + 1);

    const flash = window.setInterval(() => {
      sound.spin();
      setSymbols(["A", "B", "C", "D", "E", "W"].sort(() => Math.random() - 0.5).slice(0, 5));
    }, 70);

    try {
      const res = await fetch("/api/games/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider, amount }),
      });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, 700));
      window.clearInterval(flash);
      if (!json.ok) {
        setError(json.error);
        sound.lose();
        toast.error(t("Play failed", "খেলতে ব্যর্থ"), json.error);
        setSpinning(false);
        busy.current = false;
        return;
      }
      setSymbols(json.data.symbols);
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
  }

  if (!user) {
    return (
      <div className="space-y-3 p-6 text-center">
        <p>{t("Login to play", "খেলতে লগইন করুন")}</p>
        <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("relative overflow-hidden rounded-[1.5rem] border", hub.frame)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", hub.accent)} />
        <div className="relative space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                <LayoutGrid className="h-3.5 w-3.5" />
                {provider.replace("_", " ")} studio hub
              </div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{t(titleEn, titleBn)}</h2>
              <p className="mt-1 text-xs text-white/65">{t(hub.blurbEn, hub.blurbBn)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {hub.games.map((g) => (
              <Link key={g.href} href={g.href} className="group overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="text-xs font-black text-white">{t(g.en, g.bn)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t("Quick studio spin", "কুইক স্টুডিও স্পিন")}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {symbols.map((s, i) => {
                const m = META[s] || META.A;
                const Icon = m.icon;
                return (
                  <AnimatePresence mode="popLayout" key={`${key}-${i}-${s}`}>
                    <motion.div
                      initial={{ y: -18, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={cn("flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br shadow-inner", m.bg)}
                    >
                      <Icon className={cn("h-6 w-6", m.color)} />
                    </motion.div>
                  </AnimatePresence>
                );
              })}
            </div>
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-3 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-center text-sm font-bold",
                    result.won
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-black/30 text-white/55"
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
      </div>

      <BetControls
        amount={amount}
        setAmount={setAmount}
        onBet={play}
        disabled={spinning}
        label={t("Spin", "স্পিন")}
        min={limits.minBet}
        max={limits.maxBet}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-center text-[10px] text-white/35">
        {t("Open a title above for unique gameplay", "ইউনিক গেমপ্লের জন্য উপরের টাইটেল খুলুন")}
      </p>
    </div>
  );
}
