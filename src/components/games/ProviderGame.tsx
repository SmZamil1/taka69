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

const HUB_LINKS: Record<string, { href: string; en: string }[]> = {
  jili: [
    { href: "/games/buffalo", en: "Thunder Buffalo" },
    { href: "/games/sevenup", en: "Seven Rise" },
    { href: "/games/frog", en: "Lucky Frog" },
    { href: "/games/chili", en: "Chili Fire" },
  ],
  pg: [
    { href: "/games/candy", en: "Candy Gems" },
    { href: "/games/tiger", en: "Jungle Tiger" },
    { href: "/games/mermaid", en: "Pearl Mermaid" },
    { href: "/games/wolf", en: "Ice Wolf" },
    { href: "/games/mahjong", en: "Neon Mahjong" },
  ],
  spribe: [
    { href: "/games/crash", en: "Aviator" },
    { href: "/games/fortuneplane", en: "Fortune Plane" },
    { href: "/games/mines", en: "Mines" },
    { href: "/games/plinko", en: "Plinko" },
  ],
  evolution: [
    { href: "/games/roulette", en: "Cosmic Roulette" },
    { href: "/games/wheel", en: "Fortune Wheel" },
  ],
  fa_chai: [
    { href: "/games/dragon", en: "Jade Dragon" },
    { href: "/games/pyramid", en: "Scarab Gold" },
  ],
  jdb: [
    { href: "/games/crab", en: "Treasure Crab" },
    { href: "/games/minecart", en: "Gem Cart" },
  ],
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
        toast.error(t("Spin failed", "স্পিন ব্যর্থ"), json.error);
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
          json.data.bigPrize ? t("Big prize", "বিগ প্রাইজ") : t("Winner", "বিজয়ী"),
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

  const links = HUB_LINKS[provider] || [];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
          {provider.replace("_", " ")}
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">{t(titleEn, titleBn)}</h2>
      </div>

      {!!links.length && (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
            <LayoutGrid className="h-3.5 w-3.5" />
            {t("Featured titles", "ফিচার্ড টাইটেল")}
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-white/10 active:scale-95"
              >
                {l.en}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[1.4rem] border border-emerald-800/40 bg-gradient-to-b from-emerald-950 via-black to-black p-5 shadow-card">
        <div className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/50">
          {t("Quick spin lobby", "কুইক স্পিন লবি")}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {symbols.map((s, i) => {
            const m = META[s] || META.A;
            const Icon = m.icon;
            return (
              <AnimatePresence mode="popLayout" key={`${key}-${i}`}>
                <motion.div
                  initial={{ y: -24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.16, delay: i * 0.03 }}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br shadow-inner",
                    m.bg,
                    spinning && "animate-pulse"
                  )}
                >
                  <Icon className={cn("h-7 w-7", m.color)} strokeWidth={1.8} />
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 flex items-center justify-center gap-1.5 text-center font-bold",
                result.won ? "text-emerald-400" : "text-rose-400/80"
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
        {t("Virtual TK · fair RNG · admin max-win caps", "ভার্চুয়াল TK · ফেয়ার RNG · অ্যাডমিন ম্যাক্স-উইন ক্যাপ")}
      </p>
    </div>
  );
}
