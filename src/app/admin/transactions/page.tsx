"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";

type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  user: { username: string };
};

export default function AdminTxPage() {
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    fetch("/api/admin/transactions", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.ok && setTxs(j.data.transactions));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold-400">Transactions</h1>
      <div className="overflow-x-auto rounded-2xl border border-emerald-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-950 text-xs text-emerald-200/60">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">After</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t border-emerald-900/60">
                <td className="p-3 whitespace-nowrap text-xs">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
                <td className="p-3">{t.user.username}</td>
                <td className="p-3">{t.type}</td>
                <td className={`p-3 font-semibold ${t.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {formatCoins(t.amount)}
                </td>
                <td className="p-3">{formatCoins(t.balanceAfter)}</td>
                <td className="p-3 text-xs text-emerald-200/50">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
