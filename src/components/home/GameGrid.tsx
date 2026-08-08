"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { GAMES } from "@/lib/games-meta";

const CATS = [
  { id: "all", en: "All", bn: "সব", emoji: "✨" },
  { id: "hot", en: "Hot", bn: "গরম", emoji: "🔥" },
  { id: "crash", en: "Crash", bn: "ক্র্যাশ", emoji: "✈️" },
  { id: "slots", en: "Slots", bn: "স্লট", emoji: "🎰" },
  { id: "table", en: "Table", bn: "টেবিল", emoji: "🎲" },
];

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
            {t("Provably fair · virtual TC", "প্রুভেবলি ফেয়ার · ভার্চুয়াল TC")}
          </p>
        </div>
        <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-300">
          {list.length} {t("live", "লাইভ")}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition",
              cat === c.id
                ? "border-gold-400/50 bg-gold-500 text-emerald-950 shadow-gold"
                : "border-emerald-700/40 bg-emerald-950/70 text-emerald-50"
            )}
          >
            <span className="mr-1">{c.emoji}</span>
            {t(c.en, c.bn)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((g) => (
          <Link key={g.code} href={g.href} className="game-tile group">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={g.cover}
                alt={g.en}
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, 200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-gold-300 backdrop-blur">
                {g.tag}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="text-sm font-black text-white drop-shadow">{t(g.en, g.bn)}</div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/70">
                  <span>TAKA69</span>
                  <span className="text-emerald-300">● {g.players}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
