"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCoins, cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  Wallet,
  Trophy,
  DollarSign,
  Activity,
  Headphones,
  Gamepad2,
  ArrowRight,
  Shield,
} from "lucide-react";

type Stats = {
  users: number;
  newUsersToday: number;
  bets: number;
  volume: number;
  totalPayouts: number;
  jackpot: number;
  maintenance: boolean;
  pendingDeposits: number;
  pendingWithdraws: number;
  byGame: {
    gameType: string;
    _count: number;
    _sum: { amount: number | null; payout: number | null };
  }[];
  recentUsers: {
    id: string;
    username: string;
    balance: number;
    createdAt: string;
    role: string;
    isBanned: boolean;
    vipLevel: number;
  }[];
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

type Live = {
  online: number;
  pendingDeposits: number;
  pendingWithdraws: number;
  openSupportThreads: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState<Live | null>(null);
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

  useEffect(() => {
    let dead = false;
    async function pull() {
      try {
        const res = await fetch("/api/admin/live", { credentials: "include" });
        const j = await res.json();
        if (!dead && j.ok) setLive(j.data);
      } catch {
        /* */
      }
    }
    pull();
    const id = window.setInterval(pull, 2000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, []);

  if (error) return <p className="p-4 text-rose-400">{error}</p>;
  if (!stats) {
    return <div className="flex h-48 items-center justify-center text-white/40">Loading control center…</div>;
  }

  const houseEdge =
    stats.volume > 0
      ? (((stats.volume - stats.totalPayouts) / stats.volume) * 100).toFixed(2)
      : "0.00";
  const pending =
    (live?.pendingDeposits ?? stats.pendingDeposits) +
    (live?.pendingWithdraws ?? stats.pendingWithdraws);

  const kpis = [
    {
      label: "Live now",
      value: String(live?.online ?? "—"),
      sub: "heartbeat 45s",
      icon: Activity,
      color: "text-emerald-300",
      href: "/admin/live",
    },
    {
      label: "Total users",
      value: stats.users.toLocaleString(),
      sub: `+${stats.newUsersToday} today`,
      icon: Users,
      color: "text-sky-300",
      href: "/admin/users",
    },
    {
      label: "Volume BDT",
      value: formatCoins(stats.volume),
      sub: `${stats.bets} bets`,
      icon: DollarSign,
      color: "text-amber-300",
      href: "/admin/reports",
    },
    {
      label: "Payouts BDT",
      value: formatCoins(stats.totalPayouts),
      sub: `edge ${houseEdge}%`,
      icon: Trophy,
      color: "text-fuchsia-300",
      href: "/admin/transactions",
    },
    {
      label: "Pending wallet",
      value: String(pending),
      sub: `${live?.pendingDeposits ?? stats.pendingDeposits} dep · ${live?.pendingWithdraws ?? stats.pendingWithdraws} wd`,
      icon: Wallet,
      color: "text-orange-300",
      href: "/admin/moderation",
    },
    {
      label: "Support open",
      value: String(live?.openSupportThreads ?? 0),
      sub: "unread threads",
      icon: Headphones,
      color: "text-cyan-300",
      href: "/admin/support",
    },
  ];

  const actions = [
    { href: "/admin/moderation", label: "Review wallet", desc: "Approve deposits & withdraws" },
    { href: "/admin/games", label: "Game control", desc: "Edge, limits, win chance" },
    { href: "/admin/support", label: "Support desk", desc: "Reply with staff name" },
    { href: "/admin/settings", label: "Branding", desc: "Logo, favicon, social links" },
    { href: "/admin/live", label: "Live map", desc: "Who is on which page" },
    { href: "/admin/users", label: "Roles & access", desc: "Support / moderator permissions" },
  ];

  const maxVol = Math.max(...stats.byGame.map((g) => g._sum.amount || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            <Shield className="h-3 w-3" /> Premium control center
          </div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Operations dashboard</h1>
          <p className="text-xs text-white/40">Live KPIs · wallet alerts · game volume · staff actions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", stats.maintenance ? "bg-rose-500" : "bg-emerald-400 animate-pulse")} />
          <span className="text-xs font-semibold text-white/60">
            {stats.maintenance ? "Maintenance" : "Site live"}
          </span>
        </div>
      </div>

      {pending > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-4">
          <div className="text-2xl">⚠️</div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-amber-200">Pending money requests</div>
            <div className="text-xs text-white/55">
              {(live?.pendingDeposits ?? stats.pendingDeposits)} deposits ·{" "}
              {(live?.pendingWithdraws ?? stats.pendingWithdraws)} withdraws need review
            </div>
          </div>
          <Link
            href="/admin/moderation"
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950 active:scale-95"
          >
            Open moderation
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 transition hover:border-amber-400/30 hover:bg-white/[0.07]"
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-4 w-4", c.color)} />
                <ArrowRight className="h-3.5 w-3.5 text-white/20 transition group-hover:text-amber-300" />
              </div>
              <div className="text-[11px] text-white/45">{c.label}</div>
              <div className="mt-0.5 text-xl font-black text-white md:text-2xl">{c.value}</div>
              <div className="mt-1 text-[10px] text-white/35">{c.sub}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-white">Game volume</h2>
            <Link href="/admin/games" className="text-[11px] font-bold text-amber-300">
              Full control →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.byGame.map((g) => {
              const vol = g._sum.amount || 0;
              const pay = g._sum.payout || 0;
              const edge = vol > 0 ? (((vol - pay) / vol) * 100).toFixed(1) : "0.0";
              const pct = Math.max(4, Math.round((vol / maxVol) * 100));
              return (
                <div key={g.gameType}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/80">{g.gameType}</span>
                    <span className="text-white/40">
                      {g._count} bets · ৳{formatCoins(vol)} · <span className="text-emerald-300">{edge}%</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!stats.byGame.length && <p className="text-sm text-white/40">No bets yet</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
          <h2 className="mb-3 font-bold text-white">Quick actions</h2>
          <div className="space-y-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 transition hover:border-amber-400/30 hover:bg-amber-400/5"
              >
                <div>
                  <div className="text-sm font-bold text-white">{a.label}</div>
                  <div className="text-[11px] text-white/40">{a.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/25" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 font-bold text-white">Recent users</h2>
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex justify-between border-b border-white/5 py-1.5 text-sm">
              <div>
                <span className="font-medium">{u.username}</span>
                <span className="ml-2 text-[10px] text-white/30">VIP{u.vipLevel}</span>
                {u.isBanned && <span className="ml-1 text-[10px] text-rose-400">BANNED</span>}
              </div>
              <span className="text-amber-300">৳{formatCoins(u.balance)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <h2 className="font-bold text-white">Live bet feed</h2>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {stats.recentBets.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1.5 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-white">{b.user.username}</span>
                  <span className="ml-2 text-white/40">{b.gameType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">৳{formatCoins(b.amount)}</span>
                  <span className={cn("font-black", b.won ? "text-emerald-400" : "text-rose-400")}>
                    {b.won ? "WIN" : "LOSE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/40 to-black p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Gamepad2 className="h-5 w-5 text-amber-300" />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white">House edge (realized)</div>
            <div className="text-xs text-white/40">
              Volume ৳{formatCoins(stats.volume)} · Payouts ৳{formatCoins(stats.totalPayouts)} · Profit ৳
              {formatCoins(stats.volume - stats.totalPayouts)}
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300">{houseEdge}%</div>
        </div>
      </div>
    </div>
  );
}
