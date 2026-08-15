"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { GAMES } from "@/lib/games-meta";
import { Search, Flame, Heart, Clock } from "lucide-react";

const CATS = [
  { id: "all", en: "All", bn: "সব", emoji: "🎮" },
  { id: "hot", en: "Hot", bn: "গরম", emoji: "🔥" },
  { id: "slots", en: "Slots", bn: "স্লট", emoji: "🎰" },
  { id: "live", en: "Live", bn: "লাইভ", emoji: "📺" },
  { id: "crash", en: "Crash", bn: "ক্র্যাশ", emoji: "🚀" },
  { id: "table", en: "Table", bn: "টেবিল", emoji: "🎲" },
  { id: "predict", en: "Predict", bn: "প্রেডিক্ট", emoji: "🎯" },
  { id: "provider", en: "Studios", bn: "স্টুডিও", emoji: "🏢" },
];

const PROVIDERS = ["All", "Jili", "PG Soft", "Spribe", "Evolution", "Fa Chai", "JDB", "TAKA69"];

function GameCover({ src, alt, gradient }: { src: string; alt: string; gradient: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
        <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-70">{alt[0]}</div>
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
  const lang = useLang((s) => s.lang);
  const [cat, setCat] = useState("all");
  const [provider, setProvider] = useState("All");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    return GAMES.filter((g) => {
      const catMatch = cat === "all" || g.category === cat || (cat === "hot" && g.tag.includes("HOT"));
      const provMatch = provider === "All" || (g.provider || "TAKA69") === provider;
      const q = search.trim().toLowerCase();
      const searchMatch =
        !q || g.en.toLowerCase().includes(q) || g.bn.includes(search) || g.code.includes(q);
      return catMatch && provMatch && searchMatch;
    });
  }, [cat, provider, search]);

  return (
    <section className="space-y-3">
      {/* Category chips like JETA7 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: "hot", en: "Hot", bn: "গরম", emoji: "🔥" },
          { id: "slots", en: "Slots", bn: "স্লট", emoji: "🎰" },
          { id: "live", en: "Live", bn: "লাইভ", emoji: "👩" },
          { id: "crash", en: "Crash", bn: "ক্র্যাশ", emoji: "🎣" },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border py-2.5 transition",
              cat === c.id
                ? "border-amber-400/50 bg-emerald-800/80 text-white shadow-inner"
                : "border-white/10 bg-emerald-950/40 text-emerald-100/70 hover:bg-emerald-900/50"
            )}
          >
            <span className="text-xl">{c.emoji}</span>
            <span className="text-[10px] font-bold">{lang === "bn" ? c.bn : c.en}</span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/50 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-200/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Game name", "খেলার নাম")}
              className="w-full rounded-full border border-emerald-700/40 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-emerald-200/35 outline-none focus:border-amber-400/40"
            />
          </div>
          <button type="button" className="rounded-full p-2 text-emerald-200/50 hover:bg-white/5" aria-label="recent">
            <Clock className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-emerald-200/50 hover:bg-white/5" aria-label="fav">
            <Heart className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCat("hot")}
            className="rounded-full p-2 text-amber-300 hover:bg-white/5"
            aria-label="hot"
          >
            <Flame className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold border transition",
                provider === p
                  ? "border-amber-400/50 bg-amber-400 text-emerald-950"
                  : "border-emerald-700/40 bg-emerald-900/40 text-emerald-100/70"
              )}
            >
              {p === "All" ? t("All", "সব") : p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-sm font-black text-white">{t("All Games", "সব গেমস")}</h2>
        <span className="text-[10px] font-bold text-amber-300/80">
          {list.length} {t("games", "গেমস")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {list.map((g) => (
          <Link
            key={g.code}
            href={g.href}
            className="group relative overflow-hidden rounded-xl border border-emerald-800/50 bg-emerald-950/40 shadow-md active:scale-[0.98] transition"
          >
            <div className="relative aspect-square overflow-hidden">
              <GameCover src={g.cover} alt={g.en} gradient={g.gradient} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              {g.isNew && (
                <span className="absolute left-1.5 top-1.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                  NEW
                </span>
              )}
              {g.provider && (
                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[8px] font-bold text-amber-200 backdrop-blur">
                  {g.provider === "Jili" ? "JL" : g.provider.slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <div className="px-1.5 py-1.5">
              <div className="truncate text-[11px] font-bold text-white">{t(g.en, g.bn)}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-emerald-300/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {g.players}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!list.length && (
        <p className="py-10 text-center text-sm text-white/40">{t("No games found", "কোনো গেম পাওয়া যায়নি")}</p>
      )}
    </section>
  );
}
