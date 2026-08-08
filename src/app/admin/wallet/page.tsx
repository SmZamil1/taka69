"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  trxId?: string | null;
  accountNo?: string | null;
  accountName?: string | null;
  createdAt: string;
  user: { username: string; balance: number };
};

export default function AdminWalletPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/wallet", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setRows(json.data.requests);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setMsg("");
    const res = await fetch("/api/admin/wallet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    setMsg(json.ok ? `Request ${action}d` : json.error);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold-400">Wallet Requests</h1>
      <p className="text-xs text-emerald-200/50">Virtual TC only — approve credits/debits play-money balances.</p>
      {msg && <p className="text-sm text-gold-300">{msg}</p>}
      <div className="overflow-x-auto rounded-2xl border border-emerald-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-950 text-xs text-emerald-200/60">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Type</th>
              <th className="p-3">Method</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Details</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-emerald-900/60">
                <td className="p-3 font-semibold">{r.user.username}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.method}</td>
                <td className="p-3 text-gold-300 font-bold">{formatCoins(r.amount)}</td>
                <td className="p-3 text-xs text-emerald-200/60">
                  {r.trxId || r.accountNo || "-"}
                  {r.accountName ? ` · ${r.accountName}` : ""}
                </td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {r.status === "PENDING" && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => act(r.id, "approve")}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => act(r.id, "reject")}>Reject</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
