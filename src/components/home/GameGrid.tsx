"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { GAMES, type GameMeta } from "@/lib/games-meta";
import { Search, Flame, Heart, Clock } from "lucide-react";
import { GAME_CATEGORIES } from "@/lib/game-categories";

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
        const trashed = new Set(
          ((j.data?.trashedGames || []) as { code?: string; purgeAt?: string }[])
            .filter((x) => x?.code && (!x.purgeAt || new Date(x.purgeAt).getTime() > Date.now()))
            .map((x) => String(x.code))
        );
        const isOn = (code: string, catEnabled?: boolean) => {
          if (trashed.has(code)) return false;
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
    <section className="min-w-0 space-y-3">
      {/* Reference-style category rail: compact dark tiles with an emerald active glow. */}
      <div className="flex min-w-0 gap-1.5 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-4 sm:gap-2">
        {GAME_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={cn(
              "flex min-h-20 min-w-[5.4rem] flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 transition sm:min-w-0",
              cat === c.id
                ? "border-[#0ee48c]/70 bg-[#204c4d] text-[#0ee48c] shadow-[inset_0_0_18px_rgba(14,228,140,0.16),0_0_0_1px_rgba(14,228,140,0.1)]"
                : "border-white/10 bg-[#242e36] text-[#afb0b0] hover:border-[#0ee48c]/35 hover:bg-[#2a3843]"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.icon} alt="" className="h-9 w-9 object-contain drop-shadow" />
            <span className="text-[10px] font-bold">{lang === "bn" ? c.bn : c.en}</span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-2 rounded-2xl border border-[color-mix(in_srgb,var(--line)_90%,transparent)] bg-[color-mix(in_srgb,var(--surface-raised)_88%,transparent)] p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Game name", "খেলার নাম")}
              className="w-full rounded-full border border-[color-mix(in_srgb,var(--line)_90%,transparent)] bg-[color-mix(in_srgb,var(--page)_78%,transparent)] py-2 pl-9 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button type="button" className="rounded-full p-2 text-[var(--muted)] hover:bg-white/10" aria-label="recent">
            <Clock className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-[var(--muted)] hover:bg-white/10" aria-label="fav">
            <Heart className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCat("hot")}
            className="rounded-full p-2 text-[var(--gold-bright)] hover:bg-white/10"
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
                  ? "border-gold-400/55 bg-gold-400/15 text-gold-300"
                  : "border-white/10 bg-[#071426]/45 text-white/55"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2 sm:grid-cols-4">
        {list.map((g) => (
          <Link
            key={g.code}
            href={g.href}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-[#071426]/50"
          >
            <GameCover src={g.cover} alt={g.en} gradient={g.gradient} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            {g.isNew && (
              <div className="absolute left-1.5 top-1.5 rounded bg-gold-400 px-1.5 py-0.5 text-[9px] font-black text-[#102b57]">
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
        <div className="rounded-2xl border border-white/10 bg-[#071426]/50 p-8 text-center text-sm text-white/45">
          {t("No games match", "কোনো গেম মিলছে না")}
        </div>
      )}
    </section>
  );
}
