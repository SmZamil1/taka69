"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { GAMES } from "@/lib/games-meta";
import { Sparkles, Flame, TrendingUp, Coins, Dices, Gamepad2 } from "lucide-react";

const CATS = [
  { id: "all", en: "All", bn: "সব", icon: Sparkles },
  { id: "hot", en: "Hot", bn: "গরম", icon: Flame },
  { id: "crash", en: "Crash", bn: "ক্র্যাশ", icon: TrendingUp },
  { id: "slots", en: "Slots", bn: "স্লট", icon: Coins },
  { id: "table", en: "Table", bn: "টেবিল", icon: Dices },
  { id: "provider", en: "Studios", bn: "স্টুডিও", icon: Gamepad2 },
];

function GameCover({ src, alt, gradient }: { src: string; alt: string; gradient: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-80">
          {alt[0]}
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
      onError={() => setOk(false)}
      loading="lazy"
    />
  );
}

export function GameGrid() {
  const t = useLang((s) => s.t);
  const [cat, setCat] = useState("all");
  const list = cat === "all" ? GAMES : GAMES.filter((g) => g.category === cat);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{t("Premium Games", "প্রিমিয়াম গেমস")}</h2>
          <p className="text-[11px] text-emerald-200/50">
            {t("Provably fair · virtual TK", "প্রুভেবলি ফেয়ার · ভার্চুয়াল TK")}
          </p>
        </div>
        <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-300">
          {list.length} {t("live", "লাইভ")}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95",
                cat === c.id
                  ? "border-amber-300/50 bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow-gold scale-[1.02]"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 backdrop-blur"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(c.en, c.bn)}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {list.map((g, idx) => (
          <Link
            key={g.code}
            href={g.href}
            className="game-tile group animate-rise"
            style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
          >
            <div className="relative aspect-[1/1.05] overflow-hidden rounded-2xl border border-white/5 shadow-card transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-gold-400/30">
              <GameCover src={g.cover} alt={g.en} gradient={g.gradient} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-gold-300 backdrop-blur">
                {g.tag}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="text-sm font-black text-white drop-shadow">{t(g.en, g.bn)}</div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/70">
                  <span>TAKA69</span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {g.players}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
