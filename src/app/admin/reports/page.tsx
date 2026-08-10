"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";

type Report = {
  date: string;
  newUsers: number; deposits: number; withdraws: number;
  bets: number; volume: number; payouts: number; profit: number;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setReports(j.data.reports); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-amber-300">Daily Reports</h1>
      <p className="text-xs text-white/40">Last 14 days activity summary</p>

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-white/5 text-xs text-white/40">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">New Users</th>
                <th className="px-4 py-3 text-right">Deposits</th>
                <th className="px-4 py-3 text-right">Withdraws</th>
                <th className="px-4 py-3 text-right">Bets</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map(r => (
                <tr key={r.date} className="hover:bg-white/3">
                  <td className="px-4 py-2.5 font-mono text-white/70">{r.date}</td>
                  <td className="px-4 py-2.5 text-right text-blue-300">{r.newUsers}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-300">{formatCoins(r.deposits)}</td>
                  <td className="px-4 py-2.5 text-right text-rose-300">{formatCoins(r.withdraws)}</td>
                  <td className="px-4 py-2.5 text-right">{r.bets}</td>
                  <td className="px-4 py-2.5 text-right text-white/60">{formatCoins(r.volume)}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${r.profit >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
                    {r.profit >= 0 ? "+" : ""}{formatCoins(r.profit)}
                  </td>
                </tr>
              ))}
              {!reports.length && (
                <tr><td colSpan={7} className="py-12 text-center text-white/40">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
