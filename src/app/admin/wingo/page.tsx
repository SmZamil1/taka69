"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type Round = {
  id: string; game: string; period: number; result: number | null;
  status: string; startedAt: string; closedAt: string | null;
  _count: { bets: number };
};

const NUM_COLORS: Record<number, string> = {
  0: "text-red-400", 1: "text-green-400", 2: "text-red-400", 3: "text-green-400",
  4: "text-red-400", 5: "text-green-400", 6: "text-red-400", 7: "text-green-400",
  8: "text-red-400", 9: "text-green-400",
};

export default function AdminWingoPage() {
  const toast = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/wingo", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setRounds(json.data.rounds);
    setLoading(false);
  }

  async function manualSettle() {
    setSettling(true);
    const res = await fetch("/api/wingo/settle", {
      headers: { "x-cron-secret": "" }, credentials: "include",
    });
    const json = await res.json();
    if (json.ok) { toast.success("Settled!"); load(); }
    else toast.error(json.error || "Failed");
    setSettling(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-amber-300">WinGo Rounds</h1>
        <button onClick={manualSettle} disabled={settling}
          className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950 disabled:opacity-50">
          {settling ? "Settling..." : "⚡ Manual Settle"}
        </button>
      </div>

      <p className="text-xs text-white/40">
        Rounds settle automatically every minute via Vercel cron. Manual settle forces immediate settlement.
      </p>

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading rounds...</div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
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
              {rounds.map(r => (
                <tr key={r.id} className="hover:bg-white/3">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-white/60">{r.game}</td>
                  <td className="px-4 py-2.5 font-bold">{r.period}</td>
                  <td className="px-4 py-2.5">
                    {r.result !== null
                      ? <span className={cn("text-2xl font-black", NUM_COLORS[r.result])}>{r.result}</span>
                      : <span className="text-white/30">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">{r._count.bets}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                      r.status === "open" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white/30 text-[10px]">
                    {new Date(r.startedAt).toLocaleTimeString()}
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
