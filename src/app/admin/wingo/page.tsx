"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type Round = {
  id: string;
  game: string;
  period: number;
  result: number | null;
  status: string;
  startedAt: string;
  closedAt: string | null;
  _count: { bets: number };
};

type Cfg = {
  autoPlay: boolean;
  randomLessWin: boolean;
  forceResult: number | null;
  forceOnce: boolean;
};

const NUM_COLORS: Record<number, string> = {
  0: "text-red-400",
  1: "text-green-400",
  2: "text-red-400",
  3: "text-green-400",
  4: "text-red-400",
  5: "text-green-400",
  6: "text-red-400",
  7: "text-green-400",
  8: "text-red-400",
  9: "text-green-400",
};

const GAMES = ["WINGO1", "WINGO3", "WINGO5", "WINGO10"] as const;

export default function AdminWingoPage() {
  const toast = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [cfg, setCfg] = useState<Cfg>({
    autoPlay: true,
    randomLessWin: true,
    forceResult: null,
    forceOnce: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [forceNum, setForceNum] = useState<number | "">("");
  const [settleGame, setSettleGame] = useState<(typeof GAMES)[number]>("WINGO1");
  const [settleResult, setSettleResult] = useState<number | "">("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wingo", { credentials: "include" });
      const json = await res.json();
      if (json.ok) {
        setRounds(json.data.rounds || []);
        if (json.data.config) setCfg(json.data.config);
      }
    } catch {
      toast.error("Failed to load");
    }
    setLoading(false);
  }

  async function saveCfg(patch: Partial<Cfg>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wingo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (json.ok) {
        setCfg(json.data.config);
        toast.success("WinGo settings saved");
      } else toast.error(json.error || "Save failed");
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function manualSettle() {
    setSettling(true);
    try {
      const res = await fetch("/api/wingo/settle", { credentials: "include" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Settled + new rounds opened");
        load();
      } else toast.error(json.error || "Failed");
    } catch {
      toast.error("Network error");
    }
    setSettling(false);
  }

  async function forceSettleNow() {
    setSettling(true);
    try {
      const res = await fetch("/api/admin/wingo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          settleNow: {
            game: settleGame,
            result: settleResult === "" ? undefined : Number(settleResult),
          },
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(
          json.data.settle
            ? `Settled ${settleGame} → ${json.data.settle.result}`
            : "No open round"
        );
        load();
      } else toast.error(json.error || "Failed");
    } catch {
      toast.error("Network error");
    }
    setSettling(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-amber-300">WinGo Control</h1>
          <p className="text-xs text-white/40 mt-1">
            Auto-play runs every minute (Vercel cron). Results default to low player-win (house edge).
          </p>
        </div>
        <button
          onClick={manualSettle}
          disabled={settling}
          className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950 disabled:opacity-50"
        >
          {settling ? "Working..." : "⚡ Settle All + Open Next"}
        </button>
      </div>

      {/* Controls */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-sm font-bold text-white">Auto Play</div>
          <label className="flex items-center justify-between gap-3 text-xs text-white/70">
            <span>Always playing (open new rounds automatically)</span>
            <button
              disabled={saving}
              onClick={() => saveCfg({ autoPlay: !cfg.autoPlay })}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black",
                cfg.autoPlay ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              )}
            >
              {cfg.autoPlay ? "ON" : "OFF"}
            </button>
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-white/70">
            <span>Random less-win mode (house edge)</span>
            <button
              disabled={saving}
              onClick={() => saveCfg({ randomLessWin: !cfg.randomLessWin })}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black",
                cfg.randomLessWin ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/50"
              )}
            >
              {cfg.randomLessWin ? "ON" : "OFF"}
            </button>
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-sm font-bold text-white">Force next result</div>
          <p className="text-[11px] text-white/40">
            Set 0–9 to force the next settled round. Optional one-shot clears after use.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={forceNum === "" ? "" : String(forceNum)}
              onChange={(e) => setForceNum(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Random / house</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-[11px] text-white/60">
              <input
                type="checkbox"
                checked={cfg.forceOnce}
                onChange={(e) => setCfg((c) => ({ ...c, forceOnce: e.target.checked }))}
              />
              One-shot
            </label>
            <button
              disabled={saving}
              onClick={() =>
                saveCfg({
                  forceResult: forceNum === "" ? null : Number(forceNum),
                  forceOnce: cfg.forceOnce,
                })
              }
              className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-emerald-950"
            >
              Save force
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setForceNum("");
                saveCfg({ forceResult: null, forceOnce: false });
              }}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70"
            >
              Clear
            </button>
          </div>
          <div className="text-[11px] text-amber-200/70">
            Active force:{" "}
            {cfg.forceResult === null || cfg.forceResult === undefined
              ? "none"
              : `${cfg.forceResult}${cfg.forceOnce ? " (once)" : " (sticky)"}`}
          </div>
        </div>
      </div>

      {/* Instant settle one game */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="text-sm font-bold text-white">Force settle current round</div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={settleGame}
            onChange={(e) => setSettleGame(e.target.value as (typeof GAMES)[number])}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {GAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={settleResult === "" ? "" : String(settleResult)}
            onChange={(e) => setSettleResult(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="">House pick</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i}>
                Result {i}
              </option>
            ))}
          </select>
          <button
            onClick={forceSettleNow}
            disabled={settling}
            className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            Settle now
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading rounds...</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-white/5 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-left">Result</th>
                <th className="px-4 py-3 text-left">Bets</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rounds.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-white/60">{r.game}</td>
                  <td className="px-4 py-2.5 font-bold">{r.period}</td>
                  <td className="px-4 py-2.5">
                    {r.result !== null ? (
                      <span className={cn("text-2xl font-black", NUM_COLORS[r.result])}>{r.result}</span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{r._count.bets}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        r.status === "open"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/40"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/30 text-[10px]">
                    {new Date(r.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
