"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Users, TrendingUp, Wallet, Trophy, Gamepad2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  users: number; newUsersToday: number; bets: number; volume: number;
  totalPayouts: number; jackpot: number; maintenance: boolean;
  pendingDeposits: number; pendingWithdraws: number;
  byGame: { gameType: string; _count: number; _sum: { amount: number | null; payout: number | null } }[];
  recentUsers: { id: string; username: string; balance: number; createdAt: string; role: string; isBanned: boolean; vipLevel: number }[];
  recentBets: { id: string; gameType: string; amount: number; payout: number; won: boolean; createdAt: string; user: { username: string } }[];
  wingoStats?: { totalBets: number; totalVolume: number };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setStats(j.data); else setError(j.error || "Failed"); })
      .catch(() => setError("Network error"));
  }, []);

  if (error) return <p className="text-rose-400 p-4">{error}</p>;
  if (!stats) return <div className="flex items-center justify-center h-48 text-white/40">Loading dashboard…</div>;

  const cards = [
    { label: "Total Users", value: stats.users.toLocaleString(), sub: `+${stats.newUsersToday} today`, icon: Users, color: "text-blue-400" },
    { label: "Total Bets", value: stats.bets.toLocaleString(), icon: TrendingUp, color: "text-purple-400" },
    { label: "Volume TK", value: formatCoins(stats.volume), icon: DollarSign, color: "text-emerald-400" },
    { label: "Payouts TK", value: formatCoins(stats.totalPayouts), icon: Trophy, color: "text-amber-400" },
    { label: "Pending Dep", value: stats.pendingDeposits, icon: Wallet, color: "text-rose-400",
      href: "/admin/wallet?tab=deposits" },
    { label: "Pending WD", value: stats.pendingWithdraws, icon: Wallet, color: "text-orange-400",
      href: "/admin/wallet?tab=withdraws" },
  ];

  const houseEdge = stats.volume > 0 ? (((stats.volume - stats.totalPayouts) / stats.volume) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-amber-300">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", stats.maintenance ? "bg-rose-500" : "bg-emerald-500")} />
          <span className="text-xs text-white/50">{stats.maintenance ? "Maintenance" : "Live"}</span>
        </div>
      </div>

      {/* Alert for pending requests */}
      {(stats.pendingDeposits > 0 || stats.pendingWithdraws > 0) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
          <span className="text-amber-400 text-xl">⚠️</span>
          <div>
            <div className="font-bold text-amber-300">Pending Requests</div>
            <div className="text-xs text-white/60">
              {stats.pendingDeposits} deposits · {stats.pendingWithdraws} withdraws awaiting approval
            </div>
          </div>
          <a href="/admin/wallet" className="ml-auto rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-black text-emerald-950">
            Review
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4", c.color)} />
                <div className="text-xs text-white/45">{c.label}</div>
              </div>
              <div className="text-xl font-black text-white">{String(c.value)}</div>
              {c.sub && <div className="text-[10px] text-emerald-300/60 mt-0.5">{c.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* House edge summary */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
        <div className="text-xs text-white/40 mb-1">House Edge (realized)</div>
        <div className="text-2xl font-black text-amber-300">{houseEdge}%</div>
        <div className="text-[11px] text-white/30 mt-0.5">
          Volume: {formatCoins(stats.volume)} · Payouts: {formatCoins(stats.totalPayouts)} · Profit: {formatCoins(stats.volume - stats.totalPayouts)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
          <h2 className="mb-3 font-bold text-white">By Game</h2>
          <div className="space-y-2 text-sm">
            {stats.byGame.map(g => {
              const vol = g._sum.amount || 0;
              const pay = g._sum.payout || 0;
              const edge = vol > 0 ? (((vol - pay) / vol) * 100).toFixed(1) : "0.0";
              return (
                <div key={g.gameType} className="flex justify-between border-b border-white/5 py-1.5">
                  <span className="font-semibold">{g.gameType}</span>
                  <span className="text-white/50 text-xs">
                    {g._count} bets · {formatCoins(vol)} vol · <span className="text-emerald-300">{edge}% edge</span>
                  </span>
                </div>
              );
            })}
            {!stats.byGame.length && <p className="text-white/40">No bets yet</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
          <h2 className="mb-3 font-bold text-white">Recent Users</h2>
          {stats.recentUsers.map(u => (
            <div key={u.id} className="flex justify-between py-1.5 text-sm border-b border-white/5">
              <div>
                <span className="font-medium">{u.username}</span>
                <span className="ml-2 text-[10px] text-white/30">VIP{u.vipLevel}</span>
                {u.isBanned && <span className="ml-1 text-rose-400 text-[10px]">BANNED</span>}
              </div>
              <span className="text-amber-300">{formatCoins(u.balance)} TK</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
        <h2 className="mb-3 font-bold text-white">Recent Bets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-white/40">
              <tr><th className="py-1">User</th><th>Game</th><th>Amount</th><th>Payout</th><th>Result</th><th>Time</th></tr>
            </thead>
            <tbody>
              {stats.recentBets.map(b => (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="py-1.5 font-medium">{b.user.username}</td>
                  <td className="text-white/60">{b.gameType}</td>
                  <td>{formatCoins(b.amount)}</td>
                  <td>{formatCoins(b.payout)}</td>
                  <td className={b.won ? "text-emerald-400 font-bold" : "text-rose-400"}>
                    {b.won ? "WIN" : "LOSE"}
                  </td>
                  <td className="text-white/30 text-[10px]">{new Date(b.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
