"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";

type Tx = { id: string; type: string; amount: number; balanceAfter: number; note: string | null; method?: string | null; grossAmount?: number | null; feeAmount?: number; netAmount?: number | null; reference?: string | null; status?: string | null; createdAt: string; user: { username: string } };

export default function AdminTxPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    fetch(`/api/admin/transactions?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) { setTxs(j.data.transactions); setPages(j.data.pages || 1); } });
  }, [page, q, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black text-gold-400">Transactions</h1><input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Search user, reference, note" className="ml-auto min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" /><select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"><option value="">All types</option><option value="DEPOSIT">DEPOSIT</option><option value="WITHDRAW">WITHDRAW</option><option value="WITHDRAW_REFUND">WITHDRAW_REFUND</option><option value="ADMIN_ADJUST">ADMIN_ADJUST</option></select></div>
      <div className="overflow-x-auto rounded-2xl border border-emerald-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-950 text-xs text-emerald-200/60">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">After</th>
              <th className="p-3">Method</th><th className="p-3">Fee</th><th className="p-3">Reference</th><th className="p-3">Note</th>
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
                <td className="p-3 text-xs">{t.method || "—"}</td><td className="p-3 text-xs">{t.feeAmount ? formatCoins(t.feeAmount) : "—"}</td><td className="p-3 text-xs font-mono">{t.reference || "—"}</td><td className="p-3 text-xs text-emerald-200/50">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white disabled:opacity-30">Previous</button><span className="text-xs text-white/50">Page {page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white disabled:opacity-30">Next</button></div>
    </div>
  );
}
