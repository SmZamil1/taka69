"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { GAMES, type GameMeta } from "@/lib/games-meta";
import { Search, Flame, Star, Zap, Tv, Gamepad2, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDERS = ["All", "Jili", "PG Soft", "Spribe", "Evolution", "Fa Chai", "JDB", "TAKA69"];

const CATS = [
  { id: "all", en: "All", bn: "সব", icon: "/icons/cat-hot.png", img: true },
  { id: "hot", en: "Hot", bn: "গরম", icon: "/icons/cat-hot.png", img: true },
  { id: "crash", en: "Crash", bn: "ক্র্যাশ", icon: "/icons/cat-crash.png", img: true },
  { id: "predict", en: "Predict", bn: "প্রেডিক্ট", icon: "/icons/cat-crash.png", img: true },
  { id: "slots", en: "Slots", bn: "স্লট", icon: "/icons/cat-slots.png", img: true },
  { id: "table", en: "Table", bn: "টেবিল", icon: "/icons/cat-live.png", img: true },
  { id: "live", en: "Live", bn: "লাইভ", icon: "/icons/cat-live.png", img: true },
  { id: "provider", en: "Studios", bn: "স্টুডিও", icon: "/icons/cat-slots.png", img: true },
];

function GameCard({ g }: { g: GameMeta }) {
  const [imgOk, setImgOk] = useState(true);
  const t = useLang((s) => s.t);

  return (
    <Link href={g.href}
      className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/4 hover:border-amber-400/30 transition-all hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.cover} alt={g.en}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgOk(false)} loading="lazy" />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br flex items-center justify-center text-4xl", g.gradient)}>
            
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* NEW badge */}
        {g.isNew && (
          <div className="absolute left-2 top-2 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">NEW</div>
        )}

        {/* LIVE indicator */}
        {g.category === "live" && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[8px] font-black text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />LIVE
          </div>
        )}

        {/* Tag */}
        <div className="absolute right-2 bottom-8 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur">
          {g.tag}
        </div>
      </div>

      <div className="p-2">
        <div className="text-xs font-bold text-white truncate">{t(g.en, g.bn)}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] text-white/40">{g.provider || "TAKA69"}</span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />{g.players}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** JETA7 games lobby */
export default function GamesPage() {
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
  const [cat, setCat] = useState("all");
  const [provider, setProvider] = useState("All");
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<GameMeta[]>(GAMES);

  // Apply admin catalog overrides (cover + sort rank + enabled + custom games)
  useEffect(() => {
    fetch(`/api/config?_=${Date.now()}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const catalog = (j.data?.gamesCatalog || {}) as Record<
          string,
          {
            cover?: string;
            sortOrder?: number;
            enabled?: boolean;
            nameEn?: string;
            nameBn?: string;
            category?: GameMeta["category"];
            custom?: boolean;
            href?: string;
          }
        >;
        const gameConfig = (j.data?.gameConfig || {}) as Record<string, { enabled?: boolean }>;
        const trashed = new Set(
          ((j.data?.trashedGames || []) as { code?: string; purgeAt?: string }[])
            .filter((x) => x?.code && (!x.purgeAt || new Date(x.purgeAt).getTime() > Date.now()))
            .map((x) => String(x.code))
        );
        type CatalogGame = GameMeta & { sortOrder?: number; enabled?: boolean };
        const isOn = (code: string, catEnabled?: boolean) => {
          // catalog explicit false always hides
          if (catEnabled === false) return false;
          const cfg = gameConfig[code];
          // admin Games control: explicit false hides (default true only if missing)
          if (cfg && cfg.enabled === false) return false;
          return true;
        };
        const next: CatalogGame[] = GAMES.map((g, i) => {
          const o = catalog[g.code];
          const enabled = isOn(g.code, o?.enabled);
          return {
            ...g,
            en: o?.nameEn || g.en,
            bn: o?.nameBn || g.bn,
            cover: o?.cover || g.cover,
            category: o?.category || g.category,
            sortOrder: typeof o?.sortOrder === "number" ? o.sortOrder : i + 1,
            enabled,
          };
        });
        for (const [code, o] of Object.entries(catalog)) {
          if (next.some((g) => g.code === code)) continue;
          if (!o || o.enabled === false) continue;
          if (trashed.has(code)) continue;
          if (gameConfig[code] && gameConfig[code].enabled === false) continue;
          next.push({
            code,
            href: o.href || `/games/coming/${code}`,
            en: o.nameEn || code,
            bn: o.nameBn || o.nameEn || code,
            tag: "SOON",
            players: "—",
            cover: o.cover || "/banners/welcome.jpg",
            gradient: "from-slate-700 to-black",
            category: o.category || "hot",
            isNew: true,
            sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : 900,
            enabled: true,
          });
        }
        setGames(
          next
            .filter((g) => g.enabled === true)
            .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        );
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return games.filter(g => {
      const catMatch = cat === "all" || g.category === cat;
      const provMatch = provider === "All" || (g.provider || "TAKA69") === provider;
      const searchMatch = !search || g.en.toLowerCase().includes(search.toLowerCase()) || g.bn.includes(search);
      return catMatch && provMatch && searchMatch;
    });
  }, [cat, provider, search, games]);

  return (
    <div className="space-y-4 pb-20">
      {/* Search */}
      <div className="sticky top-0 z-20 bg-[#070f07]/95 backdrop-blur pt-2 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
          <input
            placeholder={t("Search games...", "গেম খুঁজুন...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-white/8 border border-white/10 px-4 py-3 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50 transition"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                cat === c.id
                  ? "bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow"
                  : "bg-white/8 text-white/60 hover:bg-white/12"
              )}>
              <span className="inline-flex h-7 w-7 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.icon} alt="" className="h-7 w-7 object-contain" />
              </span>
              {lang === "bn" ? c.bn : c.en}
            </button>
          ))}
        </div>

        {/* Provider filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {PROVIDERS.map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className={cn(
                "flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition",
                provider === p ? "bg-emerald-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-white/40">{filtered.length} {t("games", "গেমস")}</span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map(g => <GameCard key={g.code} g={g} />)}
        </div>
      ) : (
        <div className="py-20 text-center text-sm text-white/40">
          {t("No games found", "কোনো গেম পাওয়া যায়নি")}
        </div>
      )}
    </div>
  );
}
