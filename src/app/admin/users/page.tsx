"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  balance: number;
  role: string;
  isBanned: boolean;
  referralCode: string;
  createdAt: string;
  _count: { bets: number; referrals: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function load(query = q) {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    const json = await res.json();
    if (json.ok) setUsers(json.data.users);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(userId: string, action: string, extra: Record<string, unknown> = {}) {
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const json = await res.json();
    if (!json.ok) setMsg(json.error);
    else {
      setMsg("Updated");
      load();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold-400">Users</h1>
      <div className="flex gap-2">
        <Input
          placeholder="Search username…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => load()}>Search</Button>
      </div>
      {msg && <p className="text-sm text-gold-300">{msg}</p>}

      <div className="overflow-x-auto rounded-2xl border border-emerald-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-950 text-xs text-emerald-200/60">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Role</th>
              <th className="p-3">Bets</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-emerald-900/60">
                <td className="p-3">
                  <div className="font-semibold">{u.username}</div>
                  <div className="text-[10px] text-emerald-200/40">{u.referralCode}</div>
                  {u.isBanned && <span className="text-rose-400 text-[10px]">BANNED</span>}
                </td>
                <td className="p-3 text-gold-300">{formatCoins(u.balance)}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u._count.bets}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() => {
                        const amount = Number(prompt("Adjust amount (+/- TC)", "1000"));
                        if (!Number.isFinite(amount) || amount === 0) return;
                        act(u.id, "adjust_balance", { amount, note: "Admin panel adjust" });
                      }}
                    >
                      ± TC
                    </Button>
                    {u.isBanned ? (
                      <Button size="sm" onClick={() => act(u.id, "unban")}>
                        Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => act(u.id, "ban")}>
                        Ban
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => act(u.id, "set_role", { role: "MODERATOR" })}
                    >
                      Mod
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
