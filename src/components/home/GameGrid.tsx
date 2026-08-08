"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

const GAMES = [
  {
    href: "/games/crash",
    code: "crash",
    en: "Crash",
    bn: "ক্র্যাশ",
    emoji: "✈️",
    tag: "HOT",
    gradient: "from-rose-600 via-red-700 to-black",
  },
  {
    href: "/games/dice",
    code: "dice",
    en: "Dice",
    bn: "ডাইস",
    emoji: "🎲",
    tag: "FAIR",
    gradient: "from-indigo-600 to-violet-900",
  },
  {
    href: "/games/mines",
    code: "mines",
    en: "Mines",
    bn: "মাইনস",
    emoji: "💣",
    tag: "SKILL",
    gradient: "from-amber-600 to-orange-900",
  },
  {
    href: "/games/wheel",
    code: "wheel",
    en: "Wheel",
    bn: "হুইল",
    emoji: "🎡",
    tag: "SPIN",
    gradient: "from-cyan-600 to-blue-900",
  },
  {
    href: "/games/slots",
    code: "slots",
    en: "Slots",
    bn: "স্লট",
    emoji: "🎰",
    tag: "LUCK",
    gradient: "from-fuchsia-600 to-purple-950",
  },
];

const CATS = [
  { en: "Hot", bn: "গরম", emoji: "🔥" },
  { en: "Slots", bn: "স্লট", emoji: "🎰" },
  { en: "Crash", bn: "ক্র্যাশ", emoji: "✈️" },
  { en: "Table", bn: "টেবিল", emoji: "🎲" },
];

export function GameGrid() {
  const t = useLang((s) => s.t);

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATS.map((c) => (
          <button
            key={c.en}
            className="shrink-0 rounded-xl bg-emerald-900/70 border border-emerald-700/40 px-3 py-2 text-xs font-semibold text-emerald-50"
          >
            <span className="mr-1">{c.emoji}</span>
            {t(c.en, c.bn)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GAMES.map((g) => (
          <Link
            key={g.code}
            href={g.href}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-white/10 p-3 min-h-[120px] bg-gradient-to-br shadow-lg transition hover:scale-[1.02]",
              g.gradient
            )}
          >
            <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-gold-300">
              {g.tag}
            </span>
            <div className="text-4xl drop-shadow-lg">{g.emoji}</div>
            <div className="mt-3 text-sm font-bold text-white">{t(g.en, g.bn)}</div>
            <div className="text-[10px] text-white/70">TAKA69 · play money</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
