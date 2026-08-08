"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";

type Stats = {
  users: number;
  bets: number;
  volume: number;
  totalPayouts: number;
  jackpot: number;
  maintenance: boolean;
  byGame: { gameType: string; _count: number; _sum: { amount: number | null; payout: number | null } }[];
  recentUsers: { id: string; username: string; balance: number; createdAt: string; role: string; isBanned: boolean }[];
  recentBets: {
    id: string;
    gameType: string;
    amount: number;
    payout: number;
    won: boolean;
    createdAt: string;
    user: { username: string };
  }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setStats(j.data);
        else setError(j.error || "Failed");
      })
      .catch(() => setError("Network error"));
  }, []);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!stats) return <p className="text-emerald-200/60">Loading…</p>;

  const cards = [
    { label: "Users", value: stats.users.toLocaleString() },
    { label: "Bets", value: stats.bets.toLocaleString() },
    { label: "Volume TK", value: formatCoins(stats.volume) },
    { label: "Payouts TK", value: formatCoins(stats.totalPayouts) },
    { label: "Jackpot", value: formatCoins(stats.jackpot, 0) },
    { label: "Maintenance", value: stats.maintenance ? "ON" : "OFF" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-amber-300">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-wide text-white/45">{c.label}</div>
            <div className="mt-1 text-xl font-black text-white">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-3 font-bold">By game</h2>
          <div className="space-y-2 text-sm">
            {stats.byGame.map((g) => (
              <div key={g.gameType} className="flex justify-between border-b border-white/5 py-1.5">
                <span>{g.gameType}</span>
                <span className="text-white/55">
                  {g._count} bets · {formatCoins(g._sum.amount || 0)} vol
                </span>
              </div>
            ))}
            {!stats.byGame.length && <p className="text-white/40">No bets yet</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="mb-3 font-bold">Recent users</h2>
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex justify-between py-1.5 text-sm border-b border-white/5">
              <span>
                {u.username}{" "}
                <span className="text-[10px] text-white/40">{u.role}</span>
                {u.isBanned && <span className="ml-1 text-rose-400 text-[10px]">BANNED</span>}
              </span>
              <span className="text-amber-300">{formatCoins(u.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <h2 className="mb-3 font-bold">Recent bets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-white/45">
              <tr>
                <th className="py-1">User</th>
                <th>Game</th>
                <th>Amount</th>
                <th>Payout</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBets.map((b) => (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="py-1.5">{b.user.username}</td>
                  <td>{b.gameType}</td>
                  <td>{formatCoins(b.amount)}</td>
                  <td>{formatCoins(b.payout)}</td>
                  <td className={b.won ? "text-emerald-400" : "text-rose-400"}>
                    {b.won ? "WIN" : "LOSE"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
