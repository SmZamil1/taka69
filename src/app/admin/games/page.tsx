"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ToggleLeft, ToggleRight, Sliders, Trophy, Target, Percent, Sparkles, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_GAME_CONFIG, type GameCode, type GameLimits } from "@/lib/game-config";
import { cn } from "@/lib/utils";

const LABELS: Record<GameCode, string> = {
  aviator: "✈️ Aviator",
  baccarat: "🃏 Baccarat",
  coinflip: "🪙 Coin Flip",
  keno: "🎱 Keno",
  wingo: "🎯 WinGo",
  crash: "✈️ Aviator Crash",
  dice: "🎲 Dice",
  mines: "💣 Mines",
  wheel: "🎡 Fortune Wheel",
  slots: "🎰 Neon Slots",
  plinko: "📍 Plinko",
  hilo: "🃏 Hi-Lo",
  jili: "🎮 Jili Lobby",
  pg: "🎮 PG Soft Lobby",
  spribe: "🚀 Spribe Lobby",
  evolution: "🎯 Evolution Lobby",
  fa_chai: "🎊 Fa Chai Lobby",
  jdb: "🎮 JDB Lobby",
  fortune_maya: "🏺 Fortune Maya",
  extreme_plinko: "📍 Extreme Plinko",
};

type ExtendedLimits = GameLimits & {
  winChancePct: number;
  aviatorLive?: {
    minPlayers: number;
    maxPlayers: number;
    nightMin: number;
    nightMax: number;
    nightStartHour: number;
    nightEndHour: number;
    fakeBotsMin: number;
    fakeBotsMax: number;
    realUserWeight: number;
  };
};

function SliderField({ label, value, min, max, step = 1, unit = "", color = "emerald", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; color?: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-white/60">{label}</span>
        <span className={`text-xs font-bold ${color === "rose" ? "text-rose-400" : color === "amber" ? "text-amber-400" : "text-emerald-400"}`}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10"
        style={{ backgroundImage: `linear-gradient(to right, ${color === "rose" ? "#f43f5e" : color === "amber" ? "#f59e0b" : "#10b981"} ${pct}%, transparent ${pct}%)` }}
      />
      <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </label>
  );
}

function NumberField({ label, value, step = 1, min = 0, onChange }: { label: string; value: number; step?: number; min?: number; onChange: (v: number) => void; }) {
  return (
    <label className="block text-xs text-white/60">
      {label}
      <input type="number" step={step} min={min}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-400/40"
        value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function AdminGamesPage() {
  const [gameConfig, setGameConfig] = useState<Record<GameCode, ExtendedLimits>>(
    Object.fromEntries(Object.entries(DEFAULT_GAME_CONFIG).map(([k, v]) => [
      k, { ...v, winChancePct: Math.round((1 - (v.houseEdge || 0.05)) * 100) }
    ])) as Record<GameCode, ExtendedLimits>
  );
  const [selected, setSelected] = useState<GameCode>("crash");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data.config?.gameConfig) {
          setGameConfig((prev) => {
            const merged = { ...prev };
            for (const [k, v] of Object.entries(j.data.config.gameConfig)) {
              const lim = v as GameLimits & { winChancePct?: number };
              const pct =
                typeof lim.winChancePct === "number"
                  ? lim.winChancePct
                  : Math.round((1 - (lim.houseEdge || 0.05)) * 100);
              merged[k as GameCode] = {
                ...prev[k as GameCode],
                ...lim,
                winChancePct: Math.min(99, Math.max(1, pct)),
              };
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const g = gameConfig[selected];

  function update(field: keyof ExtendedLimits, value: number | boolean) {
    setGameConfig((prev) => {
      const updated = { ...prev[selected], [field]: value };
      // Sync winChancePct <-> houseEdge
      if (field === "winChancePct") {
        updated.houseEdge = Math.round((1 - (value as number) / 100) * 1000) / 1000;
        updated.rtpTarget = (value as number) / 100;
      } else if (field === "houseEdge") {
        updated.winChancePct = Math.round((1 - (value as number)) * 100);
        updated.rtpTarget = 1 - (value as number);
      }
      return { ...prev, [selected]: updated };
    });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      // Persist winChancePct + full limits so refresh keeps admin values
      const toSave = Object.fromEntries(
        Object.entries(gameConfig).map(([k, v]) => {
          const pct = Math.min(99, Math.max(1, Number(v.winChancePct ?? Math.round((1 - (v.houseEdge || 0.05)) * 100))));
          const houseEdge = Math.round((1 - pct / 100) * 10000) / 10000;
          return [
            k,
            {
              enabled: v.enabled !== false,
              minBet: v.minBet,
              maxBet: v.maxBet,
              maxWin: v.maxWin,
              maxMultiplier: v.maxMultiplier,
              houseEdge,
              rtpTarget: pct / 100,
              winChancePct: pct,
              bigPrizeChance: v.bigPrizeChance,
              bigPrizeMult: v.bigPrizeMult,
              // keep aviator live settings if present
              ...((v as ExtendedLimits & { aviatorLive?: unknown }).aviatorLive
                ? { aviatorLive: (v as ExtendedLimits & { aviatorLive?: unknown }).aviatorLive }
                : {}),
            },
          ];
        })
      );
      // Mirror enabled flags into gamesCatalog so public list hides disabled games
      let catalogPatch: Record<string, unknown> = {};
      try {
        const cur = await fetch("/api/admin/config", { credentials: "include" }).then((r) => r.json());
        const existing = (cur?.ok && cur.data?.config?.gamesCatalog) || {};
        catalogPatch = { ...existing };
        for (const [k, v] of Object.entries(toSave as Record<string, { enabled?: boolean }>)) {
          const prev = (catalogPatch[k] as Record<string, unknown>) || {};
          catalogPatch[k] = { ...prev, enabled: v.enabled !== false };
        }
      } catch {
        catalogPatch = Object.fromEntries(
          Object.entries(toSave as Record<string, { enabled?: boolean }>).map(([k, v]) => [
            k,
            { enabled: v.enabled !== false },
          ])
        );
      }

      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameConfig: toSave, gamesCatalog: catalogPatch }),
      });
      const json = await res.json();
      if (json.ok && json.data?.config?.gameConfig) {
        // reload from server truth
        const merged = json.data.config.gameConfig as Record<string, GameLimits & { winChancePct?: number }>;
        setGameConfig((prev) => {
          const next = { ...prev };
          for (const [k, lim] of Object.entries(merged)) {
            const pct =
              typeof lim.winChancePct === "number"
                ? lim.winChancePct
                : Math.round((1 - (lim.houseEdge || 0.05)) * 100);
            next[k as GameCode] = { ...prev[k as GameCode], ...lim, winChancePct: pct };
          }
          return next;
        });
      }
      setMsg(json.ok ? "✅ Saved — disabled games are hidden on /games" : json.error || "Save failed");
      setMsgType(json.ok ? "ok" : "err");
    } catch {
      setMsg("Network error");
      setMsgType("err");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 pb-28">
      <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050a08]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/admin" className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">
                Admin · Games
              </div>
              <h1 className="truncate text-xl font-black text-white">Game Control Center</h1>
              <p className="text-xs text-white/45">
                Pick a game → set win % & limits → Save. Changes apply live.
              </p>
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="shrink-0 gap-2 px-5 shadow-lg shadow-emerald-500/20">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save all"}
          </Button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msgType === "ok" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
          {msg}
        </div>
      )}

      {/* Game selector */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {(Object.keys(gameConfig) as GameCode[]).map((code) => {
          const enabled = gameConfig[code].enabled;
          return (
            <button key={code} onClick={() => setSelected(code)}
              className={cn("rounded-2xl border p-2.5 text-center text-xs font-bold transition-all",
                selected === code ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 scale-105" :
                enabled ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10" :
                "border-rose-500/20 bg-rose-500/5 text-rose-400/70 hover:bg-rose-500/10")}>
              <div className="text-base mb-0.5">{LABELS[code].split(" ")[0]}</div>
              <div className="leading-tight">{LABELS[code].split(" ").slice(1).join(" ")}</div>
              <div className={`mt-1 text-[9px] font-black ${enabled ? "text-emerald-400" : "text-rose-400"}`}>
                {enabled ? "ON" : "OFF"}
              </div>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[12px] text-white/55 flex flex-wrap items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-amber-300 shrink-0" />
        <span>
          <b className="text-white/80">Tip:</b> Disable a game here to hide it from the public Games page instantly after Save.
          Win chance + limits apply on next bet.
        </span>
      </div>

      {/* Game detail panel */}
      <div className="rounded-3xl border border-amber-400/15 bg-gradient-to-b from-amber-400/[0.07] via-white/[0.04] to-transparent p-5 space-y-5 shadow-[0_0_40px_rgba(251,191,36,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              <Sparkles className="h-3 w-3" /> Live controls
            </div>
            <h2 className="text-lg font-black text-white">{LABELS[selected]}</h2>
            <p className="text-[11px] text-white/40">
              code <span className="font-mono text-white/60">{selected}</span>
              {" · "}
              {g.enabled ? "visible on website" : "hidden from website"}
            </p>
          </div>
          <button type="button" onClick={() => update("enabled", !g.enabled)}
            className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border transition-colors shadow-lg",
              g.enabled ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-emerald-500/10" : "bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-rose-500/10")}>
            {g.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {g.enabled ? "Enabled · shown" : "Disabled · hidden"}
          </button>
        </div>

        {/* WIN CHANCE — The main control */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300">Win Chance Control</span>
            <span className="ml-auto text-2xl font-black text-amber-400">{g.winChancePct}%</span>
          </div>
          <SliderField
            label="Player win chance (0% = house always wins, 100% = player always wins)"
            value={g.winChancePct}
            min={0} max={100} step={1} unit="%" color="amber"
            onChange={(v) => update("winChancePct", v)}
          />
          <p className="mt-2 text-[11px] text-white/30">
            House edge: {(g.houseEdge * 100).toFixed(1)}% | RTP target: {(g.rtpTarget * 100).toFixed(1)}%
          </p>
        </div>

        {/* Betting limits */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-black text-white/80">Betting Limits</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Min Bet (TK)" value={g.minBet} min={1} onChange={(v) => update("minBet", v)} />
            <NumberField label="Max Bet (TK)" value={g.maxBet} min={1} onChange={(v) => update("maxBet", v)} />
            <NumberField label="Max Win (TK)" value={g.maxWin} min={1} onChange={(v) => update("maxWin", v)} />
            <NumberField label="Max Multiplier (x)" value={g.maxMultiplier} min={1} step={0.1} onChange={(v) => update("maxMultiplier", v)} />
          </div>
        </div>

        {/* Big Prize / Jackpot */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-black text-white/80">Big Prize / Jackpot Boost</span>
          </div>
          <div className="space-y-3">
            <SliderField label="Big prize trigger chance" value={Math.round(g.bigPrizeChance * 10000) / 100} min={0} max={2} step={0.01} unit="%" color="amber"
              onChange={(v) => update("bigPrizeChance", v / 100)} />
            <SliderField label="Big prize multiplier boost" value={g.bigPrizeMult} min={1} max={50} step={0.5} unit="x" color="amber"
              onChange={(v) => update("bigPrizeMult", v)} />
          </div>
        </div>

        {/* Advanced */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-white/50" />
            <span className="text-sm font-black text-white/50">Advanced (Manual Override)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="House Edge (0-1)" value={g.houseEdge} min={0} step={0.001} onChange={(v) => update("houseEdge", v)} />
            <NumberField label="RTP Target (0-1)" value={g.rtpTarget} min={0} step={0.001} onChange={(v) => update("rtpTarget", v)} />
          </div>
        </div>
      </div>

      {/* Quick stats for all games */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-black text-white/60 mb-3">All Games Overview</h3>
        <div className="space-y-2">
          {(Object.keys(gameConfig) as GameCode[]).map((code) => {
            const gc = gameConfig[code];
            return (
              <div key={code} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2 cursor-pointer hover:bg-white/5", selected === code && "bg-white/5")}
                onClick={() => setSelected(code)}>
                <span className="text-base">{LABELS[code].split(" ")[0]}</span>
                <span className="flex-1 text-sm font-semibold text-white/70">{LABELS[code].split(" ").slice(1).join(" ")}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${gc.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {gc.enabled ? "ON" : "OFF"}
                </span>
                <div className="w-20 bg-white/10 rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${gc.winChancePct}%` }} />
                </div>
                <span className="text-xs text-amber-400 font-bold w-10 text-right">{gc.winChancePct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aviator live crowd controls */}
      {selected === "aviator" || selected === "crash" ? (
        <AviatorLiveEditor
          value={(gameConfig[selected] as ExtendedLimits & { aviatorLive?: AviatorLiveCfg }).aviatorLive}
          onChange={(aviatorLive) =>
            setGameConfig((prev) => ({
              ...prev,
              [selected]: { ...prev[selected], aviatorLive },
            }))
          }
        />
      ) : null}

      {/* Cover image + lobby rank order + add custom game */}
      <CatalogEditor />
    </div>
  );
}

type AviatorLiveCfg = {
  minPlayers: number;
  maxPlayers: number;
  nightMin: number;
  nightMax: number;
  nightStartHour: number;
  nightEndHour: number;
  fakeBotsMin: number;
  fakeBotsMax: number;
  realUserWeight: number;
};

const DEFAULT_AVIATOR_LIVE: AviatorLiveCfg = {
  minPlayers: 217,
  maxPlayers: 999,
  nightMin: 700,
  nightMax: 1400,
  nightStartHour: 19,
  nightEndHour: 3,
  fakeBotsMin: 50,
  fakeBotsMax: 100,
  realUserWeight: 12,
};

function AviatorLiveEditor({
  value,
  onChange,
}: {
  value?: AviatorLiveCfg;
  onChange: (v: AviatorLiveCfg) => void;
}) {
  const v = { ...DEFAULT_AVIATOR_LIVE, ...(value || {}) };
  function set<K extends keyof AviatorLiveCfg>(k: K, n: number) {
    onChange({ ...v, [k]: n });
  }
  return (
    <div className="rounded-3xl border border-rose-500/25 bg-rose-950/20 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-black text-rose-200">Aviator live crowd (admin only)</h3>
        <p className="text-[11px] text-white/45">
          Displayed players float between min–max, rise at night (BD time), and scale with real online users. Fake bot bets each round.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {(
          [
            ["minPlayers", "Day min"],
            ["maxPlayers", "Day max"],
            ["nightMin", "Night min"],
            ["nightMax", "Night max"],
            ["nightStartHour", "Night start (h)"],
            ["nightEndHour", "Night end (h)"],
            ["fakeBotsMin", "Fake bots min"],
            ["fakeBotsMax", "Fake bots max"],
            ["realUserWeight", "Real user weight"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="text-[11px] text-white/50">
            {label}
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white"
              value={v[k]}
              onChange={(e) => set(k, Number(e.target.value) || 0)}
            />
          </label>
        ))}
      </div>
      <p className="text-[10px] text-white/35">Save with the main Save button above to persist.</p>
    </div>
  );
}

type CatalogRow = {
  code: string;
  nameEn: string;
  nameBn: string;
  cover: string;
  category: string;
  sortOrder: number;
  enabled: boolean;
  custom?: boolean;
};

function CatalogEditor() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCover, setNewCover] = useState("/banners/welcome.jpg");
  const [newCat, setNewCat] = useState("hot");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/config", { credentials: "include" }).then((r) => r.json()),
      import("@/lib/games-meta").then((m) => m.GAMES),
    ]).then(([j, games]) => {
      const catalog = (j?.ok && j.data?.config?.gamesCatalog) || {};
      const base = games.map((g, i) => {
        const o = catalog[g.code] || {};
        return {
          code: g.code,
          nameEn: o.nameEn || g.en,
          nameBn: o.nameBn || g.bn,
          cover: o.cover || g.cover,
          category: o.category || g.category,
          sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : i + 1,
          enabled: typeof o.enabled === "boolean" ? o.enabled : true,
          custom: false,
        } as CatalogRow;
      });
      // custom coming-soon games stored only in catalog
      for (const [code, o] of Object.entries(catalog as Record<string, Record<string, unknown>>)) {
        if (base.some((b) => b.code === code)) continue;
        if (!o || typeof o !== "object") continue;
        base.push({
          code,
          nameEn: String(o.nameEn || code),
          nameBn: String(o.nameBn || o.nameEn || code),
          cover: String(o.cover || "/banners/welcome.jpg"),
          category: String(o.category || "hot"),
          sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : 900 + base.length,
          enabled: o.enabled !== false,
          custom: true,
        });
      }
      setRows(base);
    });
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    const gamesCatalog = Object.fromEntries(
      rows.map((r) => [
        r.code,
        {
          nameEn: r.nameEn,
          nameBn: r.nameBn,
          cover: r.cover,
          category: r.category,
          sortOrder: r.sortOrder,
          enabled: r.enabled,
          custom: !!r.custom,
          href: r.custom ? `/games/coming/${r.code}` : undefined,
        },
      ])
    );
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gamesCatalog }),
      });
      const json = await res.json();
      setMsg(json.ok ? "✅ Cover, order & custom games saved" : json.error || "Failed");
    } catch {
      setMsg("Network error");
    }
    setSaving(false);
  }

  function addCustom() {
    const name = newName.trim();
    if (!name) return;
    const code = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24)}_${Date.now().toString(36).slice(-4)}`;
    setRows((r) => [
      ...r,
      {
        code,
        nameEn: name,
        nameBn: name,
        cover: newCover || "/banners/welcome.jpg",
        category: newCat || "hot",
        sortOrder: (r.reduce((m, x) => Math.max(m, x.sortOrder), 0) || 0) + 1,
        enabled: true,
        custom: true,
      },
    ]);
    setNewName("");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white">Lobby covers, rank & new games</h3>
          <p className="text-[11px] text-white/40">
            Lower rank shows first. Custom games open a 2‑min loading → Coming Soon page.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save catalog"}
        </button>
      </div>
      {msg && <div className="text-xs text-emerald-300">{msg}</div>}

      <div className="grid gap-2 rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-3 md:grid-cols-4">
        <input
          className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white md:col-span-1"
          placeholder="New game name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white md:col-span-1"
          placeholder="Cover URL"
          value={newCover}
          onChange={(e) => setNewCover(e.target.value)}
        />
        <select
          className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        >
          {["hot", "crash", "slots", "table", "live", "predict", "provider"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white"
        >
          + Add game
        </button>
      </div>

      <div className="max-h-[480px] space-y-2 overflow-y-auto">
        {rows
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((r) => (
            <div
              key={r.code}
              className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 text-xs"
            >
              <div className="col-span-2 truncate font-bold text-white/80">
                {r.nameEn}
                {r.custom ? <span className="ml-1 text-[9px] text-amber-300">NEW</span> : null}
                <div className="truncate text-[9px] text-white/30">{r.code}</div>
              </div>
              <input
                className="col-span-4 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-white"
                value={r.cover}
                onChange={(e) =>
                  setRows((all) => all.map((x) => (x.code === r.code ? { ...x, cover: e.target.value } : x)))
                }
                placeholder="/games/cover.jpg"
              />
              <select
                className="col-span-2 rounded-lg border border-white/10 bg-black/40 px-1 py-1.5 text-white"
                value={r.category}
                onChange={(e) =>
                  setRows((all) =>
                    all.map((x) => (x.code === r.code ? { ...x, category: e.target.value } : x))
                  )
                }
              >
                {["hot", "crash", "slots", "table", "live", "predict", "provider"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="col-span-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-white"
                value={r.sortOrder}
                onChange={(e) =>
                  setRows((all) =>
                    all.map((x) => (x.code === r.code ? { ...x, sortOrder: Number(e.target.value) || 0 } : x))
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  setRows((all) => all.map((x) => (x.code === r.code ? { ...x, enabled: !x.enabled } : x)))
                }
                className={`col-span-2 rounded-lg px-2 py-1.5 font-bold ${
                  r.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {r.enabled ? "Visible" : "Hidden"}
              </button>
              {r.custom ? (
                <button
                  type="button"
                  className="col-span-1 rounded-lg bg-white/10 py-1.5 text-rose-300"
                  onClick={() => setRows((all) => all.filter((x) => x.code !== r.code))}
                >
                  ×
                </button>
              ) : (
                <div className="col-span-1" />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
