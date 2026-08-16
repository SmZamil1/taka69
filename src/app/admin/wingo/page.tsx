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


export default function AdminWingoPage() {
  const toast = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [cfg, setCfg] = useState<Cfg>({
    autoPlay: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
            Results are generated independently of wagers using a secure random source. Admins can pause new rounds, but cannot influence outcomes.
          </p>
        </div>

      </div>

      {/* Fairness and pause controls */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="text-sm font-bold text-white">Round lifecycle</div>
          <label className="flex items-center justify-between gap-3 text-xs text-white/70">
            <span>Open new rounds automatically</span>
            <button
              disabled={saving}
              onClick={() => saveCfg({ autoPlay: !cfg.autoPlay })}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black",
                cfg.autoPlay ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              )}
            >
              {cfg.autoPlay ? "ON" : "PAUSED"}
            </button>
          </label>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
          <div className="text-sm font-bold text-emerald-200">Provably fair outcomes</div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/55">
            Every result is generated independently of the bet pool with a secure random source.
            Cheapest-payout selection, low-win bias, forced results, and manual result settlement are disabled.
          </p>
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
