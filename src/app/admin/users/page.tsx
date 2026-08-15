"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Search, Ban, CheckCircle, PlusCircle, MinusCircle, Crown } from "lucide-react";

type User = {
  id: string; username: string; balance: number; role: string;
  isBanned: boolean; createdAt: string; vipLevel: number; vipExp: number;
  totalDeposit: number; totalBet: number; totalCommission: number; referralCode: string;
  permissions?: string[] | null;
  _count?: { referrals: number };
};

const ROLES = ["USER","MODERATOR","SUPPORT","ADMIN"];
const VIP_NAMES = ["Bronze","Silver","Gold","Platinum","Diamond","Legend"];
const STAFF_PERMS = [
  "dashboard","users","wallet","moderation","support","games","wingo",
  "banners","missions","vip","notifications","promotions","transactions","reports","settings","system",
] as const;

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjNote, setAdjNote] = useState("");
  const [adjType, setAdjType] = useState<"add"|"sub">("add");
  const [working, setWorking] = useState(false);
  const [permDraft, setPermDraft] = useState<string[]>([]);

  async function load(search = "") {
    setLoading(true);
    const res = await fetch(`/api/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`, { credentials: "include" });
    const json = await res.json();
    if (json.ok) setUsers(json.data.users);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleBan(u: User) {
    setWorking(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ id: u.id, isBanned: !u.isBanned }),
    });
    const json = await res.json();
    if (json.ok) { toast.success(u.isBanned ? "User unbanned" : "User banned"); load(q); }
    else toast.error(json.error);
    setWorking(false);
  }

  async function changeRole(u: User, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ id: u.id, role }),
    });
    const json = await res.json();
    if (json.ok) { toast.success("Role updated"); load(q); }
    else toast.error(json.error);
  }

  async function savePermissions(u: User) {
    setWorking(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: u.id, permissions: permDraft }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("Feature access updated");
      load(q);
      setSelected(null);
    } else toast.error(json.error || "Failed");
    setWorking(false);
  }

  async function adjustBalance() {
    if (!selected || adjAmount <= 0) return;
    setWorking(true);
    const amount = adjType === "add" ? adjAmount : -adjAmount;
    const res = await fetch("/api/admin/users/adjust", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ userId: selected.id, amount, note: adjNote }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(`Balance adjusted: ${amount > 0 ? "+" : ""}${amount} TK`);
      setSelected(null); setAdjAmount(0); setAdjNote("");
      load(q);
    } else toast.error(json.error);
    setWorking(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-amber-300">Users</h1>
        <span className="text-xs text-white/40">{users.length} loaded</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
          <Input placeholder="Search username..." value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(q)} className="pl-9" />
        </div>
        <Button onClick={() => load(q)}>Search</Button>
      </div>

      {/* Adjust balance + staff permissions */}
      {selected && (
        <div className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="font-bold text-amber-300">Manage — {selected.username}</div>
          <div className="flex gap-2">
            <button onClick={() => setAdjType("add")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold ${adjType==="add" ? "bg-emerald-500 text-white" : "bg-white/8 text-white/60"}`}>
              + Add
            </button>
            <button onClick={() => setAdjType("sub")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold ${adjType==="sub" ? "bg-rose-500 text-white" : "bg-white/8 text-white/60"}`}>
              - Subtract
            </button>
          </div>
          <Input type="number" min={0} placeholder="Amount BDT" value={adjAmount || ""}
            onChange={e => setAdjAmount(Number(e.target.value))} />
          <Input placeholder="Note (reason)" value={adjNote} onChange={e => setAdjNote(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="gold" disabled={working || adjAmount <= 0} onClick={adjustBalance} className="flex-1">
              {working ? "Saving..." : `${adjType === "add" ? "+" : "-"}${adjAmount} BDT`}
            </Button>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
          </div>

          {["SUPPORT", "MODERATOR"].includes(selected.role) && (
            <div className="border-t border-white/10 pt-3">
              <div className="mb-2 text-xs font-bold text-white/70">
                Feature access for {selected.role}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STAFF_PERMS.map((p) => {
                  const on = permDraft.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setPermDraft((d) => (on ? d.filter((x) => x !== p) : [...d, p]))
                      }
                      className={`rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold ${
                        on
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                          : "border-white/10 bg-black/20 text-white/45"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-3"
                disabled={working}
                onClick={() => savePermissions(selected)}
              >
                Save feature access
              </Button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading users...</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{u.username}</span>
                    <span className="text-[10px] text-white/40 font-mono">{u.referralCode}</span>
                    {u.isBanned && <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">BANNED</span>}
                    <span className="flex items-center gap-1 text-[10px] text-purple-300">
                      <Crown className="h-3 w-3" /> VIP{u.vipLevel} {VIP_NAMES[u.vipLevel]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-white/50">
                    <span>Balance: <strong className="text-amber-300">{formatCoins(u.balance)} TK</strong></span>
                    <span>Dep: {formatCoins(u.totalDeposit)}</span>
                    <span>Bet: {formatCoins(u.totalBet)}</span>
                    <span>Comm: {formatCoins(u.totalCommission)}</span>
                    <span>Refs: {u._count?.referrals ?? 0}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-white/25">{new Date(u.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <select value={u.role}
                    onChange={e => changeRole(u, e.target.value)}
                    className="rounded-lg bg-white/8 px-2 py-1 text-[10px] text-white border border-white/10">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => toggleBan(u)} disabled={working}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-white/8 hover:bg-white/15 text-white">
                    {u.isBanned ? <><CheckCircle className="h-3 w-3 text-emerald-400" /> Unban</> : <><Ban className="h-3 w-3 text-rose-400" /> Ban</>}
                  </button>
                  <button
                    onClick={() => {
                      setSelected(u);
                      setPermDraft(Array.isArray(u.permissions) ? (u.permissions as string[]) : []);
                    }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-white/8 hover:bg-white/15 text-amber-300">
                    <PlusCircle className="h-3 w-3" /> Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!users.length && <div className="py-12 text-center text-white/40">No users found</div>}
        </div>
      )}
    </div>
  );
}
