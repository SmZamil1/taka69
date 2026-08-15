"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ToggleLeft, ToggleRight, Sliders, Trophy, Target, Percent } from "lucide-react";
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

type ExtendedLimits = GameLimits & { winChancePct: number };

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
              const lim = v as GameLimits;
              merged[k as GameCode] = { ...prev[k as GameCode], ...lim, winChancePct: Math.round((1 - (lim.houseEdge || 0.05)) * 100) };
            }
            return merged;
          });
        }
      }).catch(() => {});
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
      // Remove winChancePct (UI-only field) before saving
      const toSave = Object.fromEntries(
        Object.entries(gameConfig).map(([k, v]) => {
          const { winChancePct, ...rest } = v;
          return [k, rest];
        })
      );
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameConfig: toSave }),
      });
      const json = await res.json();
      setMsg(json.ok ? "✅ Game settings saved!" : json.error || "Save failed");
      setMsgType(json.ok ? "ok" : "err");
    } catch {
      setMsg("Network error"); setMsgType("err");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-full border border-white/10 bg-white/5 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">🎮 Game Control Center</h1>
            <p className="text-xs text-white/45">Tune every game — win chance, limits & more</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="flex items-center gap-2 px-5">
          <Save className="h-4 w-4" />{saving ? "Saving…" : "Save All"}
        </Button>
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

      {/* Game detail panel */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{LABELS[selected]}</h2>
          <button onClick={() => update("enabled", !g.enabled)}
            className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold border transition-colors",
              g.enabled ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300" : "bg-rose-500/20 border-rose-400/40 text-rose-300")}>
            {g.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {g.enabled ? "Enabled" : "Disabled"}
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

      {/* Cover image + lobby rank order */}
      <CatalogEditor />
    </div>
  );
}

type CatalogRow = { code: string; cover: string; sortOrder: number; enabled: boolean };

function CatalogEditor() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/config", { credentials: "include" }).then((r) => r.json()),
      import("@/lib/games-meta").then((m) => m.GAMES),
    ]).then(([j, games]) => {
      const catalog = (j?.ok && j.data?.config?.gamesCatalog) || {};
      setRows(
        games.map((g, i) => {
          const o = catalog[g.code] || {};
          return {
            code: g.code,
            cover: o.cover || g.cover,
            sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : i + 1,
            enabled: typeof o.enabled === "boolean" ? o.enabled : true,
          };
        })
      );
    });
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    const gamesCatalog = Object.fromEntries(
      rows.map((r) => [r.code, { cover: r.cover, sortOrder: r.sortOrder, enabled: r.enabled }])
    );
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gamesCatalog }),
      });
      const json = await res.json();
      setMsg(json.ok ? "✅ Cover & order saved" : json.error || "Failed");
    } catch {
      setMsg("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white">Lobby covers & rank order</h3>
          <p className="text-[11px] text-white/40">Lower rank shows first on /games</p>
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
      <div className="max-h-[420px] space-y-2 overflow-y-auto">
        {rows
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((r) => (
            <div key={r.code} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 text-xs">
              <div className="col-span-2 font-bold text-white/80 truncate">{r.code}</div>
              <input
                className="col-span-5 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-white"
                value={r.cover}
                onChange={(e) =>
                  setRows((all) => all.map((x) => (x.code === r.code ? { ...x, cover: e.target.value } : x)))
                }
                placeholder="/games/cover.jpg"
              />
              <input
                type="number"
                className="col-span-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-white"
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
                className={`col-span-3 rounded-lg px-2 py-1.5 font-bold ${
                  r.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {r.enabled ? "Visible" : "Hidden"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
