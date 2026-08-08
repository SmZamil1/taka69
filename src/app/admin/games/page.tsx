"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_GAME_CONFIG,
  type GameCode,
  type GameLimits,
} from "@/lib/game-config";
import { cn } from "@/lib/utils";

const LABELS: Record<GameCode, string> = {
  crash: "Aviator Crash",
  dice: "Dice",
  mines: "Mines",
  wheel: "Fortune Wheel",
  slots: "Neon Slots",
  plinko: "Plinko",
  hilo: "Hi-Lo",
  jili: "Jili Lobby",
  pg: "PG Soft Lobby",
  spribe: "Spribe Lobby",
  evolution: "Evolution Lobby",
  fa_chai: "Fa Chai Lobby",
  jdb: "JDB Lobby",
};

export default function AdminGamesPage() {
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);
  const [selected, setSelected] = useState<GameCode>("crash");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data.config?.gameConfig) {
          setGameConfig({ ...DEFAULT_GAME_CONFIG, ...j.data.config.gameConfig });
        }
      })
      .catch(() => {});
  }, []);

  const g = gameConfig[selected];

  function update(field: keyof GameLimits, value: number | boolean) {
    setGameConfig((prev) => ({
      ...prev,
      [selected]: { ...prev[selected], [field]: value },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameConfig }),
      });
      const json = await res.json();
      setMsg(json.ok ? "Saved game controls" : json.error || "Save failed");
    } catch {
      setMsg("Network error");
    }
    setSaving(false);
  }

  function Field({
    label,
    field,
    step = 1,
  }: {
    label: string;
    field: keyof GameLimits;
    step?: number;
  }) {
    const val = g[field];
    if (typeof val === "boolean") return null;
    return (
      <label className="block text-xs text-white/60">
        {label}
        <input
          type="number"
          step={step}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-400/40"
          value={val as number}
          onChange={(e) => update(field, Number(e.target.value))}
        />
      </label>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-16">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="rounded-full border border-white/10 bg-white/5 p-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Game Control Center</h1>
          <p className="text-xs text-white/45">Enable, cap, and tune every title</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {(Object.keys(gameConfig) as GameCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                selected === code
                  ? "bg-amber-400 text-emerald-950"
                  : "text-white/70 hover:bg-white/5"
              )}
            >
              <span>{LABELS[code] || code}</span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  gameConfig[code].enabled ? "bg-emerald-400" : "bg-rose-400"
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {selected}
              </div>
              <h2 className="text-lg font-black text-white">{LABELS[selected]}</h2>
            </div>
            <button
              type="button"
              onClick={() => update("enabled", !g.enabled)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold",
                g.enabled
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  : "border-rose-400/30 bg-rose-500/15 text-rose-300"
              )}
            >
              {g.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              {g.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min bet (TK)" field="minBet" />
            <Field label="Max bet (TK)" field="maxBet" />
            <Field label="Max win (TK)" field="maxWin" />
            <Field label="Max multiplier" field="maxMultiplier" />
            <Field label="House edge (0-1)" field="houseEdge" step={0.001} />
            <Field label="RTP target (0-1)" field="rtpTarget" step={0.001} />
            <Field label="Big prize chance (0-1)" field="bigPrizeChance" step={0.001} />
            <Field label="Big prize mult" field="bigPrizeMult" />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/55 leading-relaxed">
            Changes apply on next bet for live games. Crash house edge controls instant-bust rate.
            Max win/mult hard-cap every payout server-side.
          </div>

          <Button size="lg" className="w-full gap-2" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save all game controls"}
          </Button>
          {msg && <p className="text-sm text-amber-300">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
