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

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-100/80 space-y-2">
        <div className="text-sm font-bold text-emerald-200">How to control player winnings</div>
        <ul className="list-disc space-y-1.5 pl-4">
          <li><b className="text-white">maxMultiplier</b> — hard ceiling on any single win (e.g. Plinko 2, Wheel 5, Studio 8). Players cannot get higher than this.</li>
          <li><b className="text-white">maxWin</b> — max TK paid out on one bet (stake × mult is cut down to this).</li>
          <li><b className="text-white">minBet / maxBet</b> — allowed stake range.</li>
          <li><b className="text-white">houseEdge</b> — crash/dice house cut (0.03 = 3%). Higher = house keeps more.</li>
          <li><b className="text-white">bigPrizeChance</b> — rare jackpot chance (0.003 = 0.3%). Keep low (0.001–0.005).</li>
          <li><b className="text-white">bigPrizeMult</b> — multiplier if jackpot hits (still capped by maxMultiplier/maxWin).</li>
          <li><b className="text-white">enabled</b> — turn a game off without deleting it.</li>
        </ul>
        <p className="text-white/55">
          Tip: for “rarely above 2x”, set maxMultiplier to 2–5 and bigPrizeChance under 0.005.
          Server also clamps old high values automatically.
        </p>
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
            <Field label="Max win per bet (TK)" field="maxWin" />
            <Field label="Max multiplier (hard cap)" field="maxMultiplier" />
            <Field label="House edge (0.03=3%)" field="houseEdge" step={0.001} />
            <Field label="RTP target (info)" field="rtpTarget" step={0.001} />
            <Field label="Big prize chance (0.003=0.3%)" field="bigPrizeChance" step={0.001} />
            <Field label="Big prize multiplier" field="bigPrizeMult" />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/55 leading-relaxed space-y-1">
            <p>Changes apply on the <b className="text-white">next bet</b>.</p>
            <p><b className="text-white">Rare >2x:</b> set Max multiplier 2–5 and Big prize chance ≤ 0.005.</p>
            <p><b className="text-white">Crash:</b> house edge = instant-bust rate. Max mult can stay high (e.g. 100).</p>
            <p>Server always hard-caps payout by maxWin and maxMultiplier.</p>
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
