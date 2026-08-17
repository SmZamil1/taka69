"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

type Req = {
  id: string; type: string; method: string; amount: number; status: string;
  accountName: string | null; accountNo: string | null; trxId: string | null;
  screenshotUrl: string | null; bonusAmount: number; note: string | null; adminNote: string | null;
  channel?: string | null; grossAmount?: number | null; feeAmount?: number; netAmount?: number | null; providerRef?: string | null; rejectionReason?: string | null; processedAt?: string | null;
  createdAt: string; user: { id: string; username: string; balance: number };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-300",
  APPROVED: "bg-emerald-500/20 text-emerald-300",
  REJECTED: "bg-rose-500/20 text-rose-300",
  CANCELLED: "bg-white/10 text-white/40",
};

export default function AdminWalletPage() {
  const toast = useToast();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"DEPOSIT"|"WITHDRAW">("DEPOSIT");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [working, setWorking] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string,string>>({});
  const [bonusMap, setBonusMap] = useState<Record<string,number>>({});
  const [providerRef, setProviderRef] = useState<Record<string,string>>({});
  const [rejectionReason, setRejectionReason] = useState<Record<string,string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/wallet?type=${tab}&status=${statusFilter}`, { credentials: "include" });
    const json = await res.json();
    if (json.ok) setReqs(json.data.requests);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab, statusFilter]); // eslint-disable-line

  async function approve(r: Req) {
    setWorking(r.id);
    const res = await fetch("/api/admin/wallet", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        id: r.id, action: "approve",
        adminNote: adminNote[r.id] || undefined,
        bonusAmount: bonusMap[r.id] || 0,
        providerRef: providerRef[r.id] || undefined,
      }),
    });
    const json = await res.json();
    if (json.ok) { toast.success("Approved ✓"); load(); }
    else toast.error(json.error || "Failed");
    setWorking(null);
  }

  async function reject(r: Req) {
    setWorking(r.id);
    const res = await fetch("/api/admin/wallet", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ id: r.id, action: "reject", adminNote: adminNote[r.id] || undefined, rejectionReason: rejectionReason[r.id] || "Rejected by admin" }),
    });
    const json = await res.json();
    if (json.ok) { toast.success("Rejected"); load(); }
    else toast.error(json.error || "Failed");
    setWorking(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-black text-amber-300">Wallet Requests</h1><a href="/admin/wallet/cards" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">Bound wallets</a></div>

      <div className="flex gap-2 flex-wrap">
        {(["DEPOSIT","WITHDRAW"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-xl px-4 py-2 text-xs font-bold transition",
              tab === t ? "bg-amber-400 text-emerald-950" : "bg-white/8 text-white hover:bg-white/15"
            )}>{t}</button>
        ))}
        <div className="ml-auto flex gap-1">
          {["PENDING","APPROVED","REJECTED","ALL"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-lg px-3 py-1.5 text-[10px] font-bold transition",
                statusFilter === s ? "bg-white/20 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
              )}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading requests...</div>
      ) : reqs.length === 0 ? (
        <div className="py-12 text-center text-white/40">No {statusFilter.toLowerCase()} {tab.toLowerCase()} requests</div>
      ) : (
        <div className="space-y-3">
          {reqs.map(r => (
            <div key={r.id} className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white">{r.user.username}</span>
                    <span className="text-xs text-white/40">bal: {formatCoins(r.user.balance)} TK</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[r.status])}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/50">
                    <span className="font-bold text-emerald-300">{formatCoins(r.amount)} TK</span>
                    {r.feeAmount ? <span>fee {formatCoins(r.feeAmount)} TK</span> : null}
                    {r.netAmount ? <span>net {formatCoins(r.netAmount)} TK</span> : null}
                    <span>{r.method}</span>
                    {r.channel && <span>{r.channel}</span>}
                    {r.accountNo && <span>{r.accountName} · {r.accountNo}</span>}
                    {r.trxId && <span className="font-mono text-amber-300/70">TrxID: {r.trxId}</span>}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
                  {r.adminNote && <div className="text-[11px] text-white/40 mt-1">Admin note: {r.adminNote}</div>}
                  {r.rejectionReason && <div className="text-[11px] text-rose-300/80 mt-1">Rejection: {r.rejectionReason}</div>}
                  {r.processedAt && <div className="text-[10px] text-white/25 mt-1">Processed: {new Date(r.processedAt).toLocaleString()}</div>}
                </div>
                {r.screenshotUrl && (
                  <a href={r.screenshotUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.screenshotUrl} alt="screenshot"
                      className="h-16 w-16 rounded-xl object-cover border border-white/10 hover:scale-105 transition" />
                  </a>
                )}
              </div>

              {r.status === "PENDING" && (
                <div className="space-y-2">
                  {tab === "DEPOSIT" && (
                    <div className="flex gap-2">
                      <input type="number" placeholder="Bonus TK (optional)" min={0}
                        value={bonusMap[r.id] || ""}
                        onChange={e => setBonusMap(p => ({ ...p, [r.id]: Number(e.target.value) }))}
                        className="flex-1 rounded-xl bg-white/8 px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-amber-400" />
                    </div>
                  )}
                  <Input placeholder="Admin note (optional)" value={adminNote[r.id] || ""}
                    onChange={e => setAdminNote(p => ({ ...p, [r.id]: e.target.value }))} />
                  <Input placeholder={tab === "WITHDRAW" ? "Provider payout reference (optional)" : "Provider reference (optional)"} value={providerRef[r.id] || ""}
                    onChange={e => setProviderRef(p => ({ ...p, [r.id]: e.target.value }))} />
                  {tab === "WITHDRAW" && <Input placeholder="Rejection reason (used on reject)" value={rejectionReason[r.id] || ""}
                    onChange={e => setRejectionReason(p => ({ ...p, [r.id]: e.target.value }))} />}
                  <div className="flex gap-2">
                    <button onClick={() => approve(r)} disabled={working === r.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-2.5 text-sm font-black text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50">
                      <CheckCircle className="h-4 w-4" />
                      {working === r.id ? "Processing..." : `Approve ${formatCoins(r.amount)} TK`}
                    </button>
                    <button onClick={() => reject(r)} disabled={working === r.id}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/20 px-4 py-2.5 text-sm font-black text-rose-400 hover:bg-rose-500/25 transition disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
