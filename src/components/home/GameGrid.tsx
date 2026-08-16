"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { GAMES, type GameMeta } from "@/lib/games-meta";
import { Search, Flame, Heart, Clock } from "lucide-react";

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
  const [games, setGames] = useState<GameMeta[]>(GAMES);

  // Hide games disabled in Admin → Games (gameConfig + catalog)
  useEffect(() => {
    fetch(`/api/config?_=${Date.now()}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const catalog = (j.data?.gamesCatalog || {}) as Record<
          string,
          {
            cover?: string;
            enabled?: boolean;
            nameEn?: string;
            nameBn?: string;
            category?: GameMeta["category"];
            custom?: boolean;
            href?: string;
            sortOrder?: number;
          }
        >;
        const gameConfig = (j.data?.gameConfig || {}) as Record<string, { enabled?: boolean }>;
        const isOn = (code: string, catEnabled?: boolean) => {
          if (catEnabled === false) return false;
          const cfg = gameConfig[code];
          if (cfg && cfg.enabled === false) return false;
          return true;
        };

        type Row = GameMeta & { sortOrder?: number; enabled?: boolean };
        const next: Row[] = GAMES.map((g, i) => {
          const o = catalog[g.code];
          return {
            ...g,
            en: o?.nameEn || g.en,
            bn: o?.nameBn || g.bn,
            cover: o?.cover || g.cover,
            category: o?.category || g.category,
            sortOrder: typeof o?.sortOrder === "number" ? o.sortOrder : i + 1,
            enabled: isOn(g.code, o?.enabled),
          };
        });

        for (const [code, o] of Object.entries(catalog)) {
          if (next.some((g) => g.code === code)) continue;
          if (!o || o.enabled === false) continue;
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

  const list = useMemo(() => {
    return games.filter((g) => {
      const catMatch = cat === "all" || g.category === cat || (cat === "hot" && g.tag.includes("HOT"));
      const provMatch = provider === "All" || (g.provider || "TAKA69") === provider;
      const q = search.trim().toLowerCase();
      const searchMatch =
        !q || g.en.toLowerCase().includes(q) || g.bn.includes(search) || g.code.includes(q);
      return catMatch && provMatch && searchMatch;
    });
  }, [cat, provider, search, games]);

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
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold",
                provider === p
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                  : "border-white/10 bg-black/20 text-white/50"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((g) => (
          <Link
            key={g.code}
            href={g.href}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30"
          >
            <GameCover src={g.cover} alt={g.en} gradient={g.gradient} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            {g.isNew && (
              <div className="absolute left-1.5 top-1.5 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                NEW
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="truncate text-[11px] font-black text-white">
                {lang === "bn" ? g.bn : g.en}
              </div>
              <div className="text-[9px] text-white/50">{g.players}</div>
            </div>
          </Link>
        ))}
      </div>

      {!list.length && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-white/45">
          {t("No games match", "কোনো গেম মিলছে না")}
        </div>
      )}
    </section>
  );
}
