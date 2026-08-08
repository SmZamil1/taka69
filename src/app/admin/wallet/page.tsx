"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";

type Row = {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  trxId?: string | null;
  accountNo?: string | null;
  accountName?: string | null;
  screenshotUrl?: string | null;
  bonusAmount?: number;
  createdAt: string;
  user: { username: string; balance: number; id: string };
};

export default function AdminWalletPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [bonusMap, setBonusMap] = useState<Record<string, number>>({});
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/admin/wallet", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setRows(json.data.requests);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setMsg("");
    const res = await fetch("/api/admin/wallet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        action,
        bonusAmount: action === "approve" ? bonusMap[id] || 0 : 0,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setMsg(`Request ${action}d`);
      toast.success(`Request ${action}d`);
    } else {
      setMsg(json.error);
      toast.error(json.error);
    }
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold-400">Wallet Requests</h1>
      <p className="text-xs text-emerald-200/50">
        Virtual TK only. On deposit approve you can add bonus. Screenshots auto-delete after 24h.
      </p>
      {msg && <p className="text-sm text-gold-300">{msg}</p>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold text-white">{r.user.username} · {r.type}</div>
                <div className="text-xs text-emerald-200/60">
                  {r.method.toUpperCase()} · bal {formatCoins(r.user.balance)} TK · {new Date(r.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 text-lg font-black text-gold-300">{formatCoins(r.amount)} TK</div>
                <div className="text-xs text-emerald-100/70">
                  {r.trxId ? `TrxID: ${r.trxId}` : ""}
                  {r.accountNo ? ` · Acc: ${r.accountNo}` : ""}
                  {r.accountName ? ` · ${r.accountName}` : ""}
                </div>
                <div className="mt-1 text-xs font-semibold text-emerald-300">Status: {r.status}</div>
              </div>
              {r.screenshotUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <a href={r.screenshotUrl} target="_blank" rel="noreferrer">
                  <img src={r.screenshotUrl} alt="screenshot" className="h-28 w-40 rounded-xl object-cover border border-emerald-700" />
                </a>
              )}
            </div>
            {r.status === "PENDING" && (
              <div className="flex flex-wrap items-end gap-2">
                {r.type === "DEPOSIT" && (
                  <div className="w-36">
                    <label className="text-[10px] text-emerald-200/60">Bonus TK</label>
                    <Input
                      type="number"
                      value={bonusMap[r.id] ?? 0}
                      onChange={(e) =>
                        setBonusMap((m) => ({ ...m, [r.id]: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                )}
                <Button size="sm" onClick={() => act(r.id, "approve")}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => act(r.id, "reject")}>Reject</Button>
              </div>
            )}
            {r.status === "APPROVED" && !!r.bonusAmount && (
              <div className="text-xs text-emerald-300">Bonus given: {formatCoins(r.bonusAmount)} TK</div>
            )}
          </div>
        ))}
        {!rows.length && <p className="text-sm text-emerald-200/50">No requests</p>}
      </div>
    </div>
  );
}
