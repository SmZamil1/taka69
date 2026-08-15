"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Shield, Save } from "lucide-react";

type Staff = {
  id: string;
  username: string;
  role: string;
  isBanned: boolean;
  permissions?: string[] | null;
};

const STAFF_PERMS = [
  "dashboard",
  "users",
  "wallet",
  "moderation",
  "support",
  "games",
  "wingo",
  "banners",
  "missions",
  "vip",
  "notifications",
  "promotions",
  "transactions",
  "reports",
  "settings",
  "system",
] as const;

export default function AdminAdminsPage() {
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [working, setWorking] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/users?q=", { credentials: "include" });
    const j = await res.json();
    if (!j.ok) return;
    const list = (j.data.users || []).filter((u: Staff) =>
      ["SUPPORT", "MODERATOR", "ADMIN"].includes(u.role)
    );
    setStaff(list);
  }

  useEffect(() => {
    load();
  }, []);

  function pick(u: Staff) {
    setSelected(u);
    setDraft(Array.isArray(u.permissions) ? (u.permissions as string[]) : []);
  }

  async function save() {
    if (!selected || selected.role === "ADMIN") return;
    setWorking(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: selected.id, permissions: draft }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Permissions updated");
      load();
    } else toast.error(j.error || "Failed");
    setWorking(false);
  }

  async function setRole(u: Staff, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: u.id, role }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Role updated");
      load();
    } else toast.error(j.error || "Failed");
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
          <Shield className="h-3 w-3" /> Staff access
        </div>
        <h1 className="text-2xl font-black text-white">Admins & permissions</h1>
        <p className="text-xs text-white/40">
          Main admin grants SUPPORT / MODERATOR exact features. Toggle on/off any panel.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          {staff.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => pick(u)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selected?.id === u.id
                  ? "border-amber-400/40 bg-amber-400/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="font-bold text-white">{u.username}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
                <span>{u.role}</span>
                {u.isBanned && <span className="text-rose-400">BANNED</span>}
                <span className="text-white/25">
                  {(Array.isArray(u.permissions) ? u.permissions.length : 0) || "default"} perms
                </span>
              </div>
            </button>
          ))}
          {!staff.length && (
            <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-white/40">
              No staff users yet — set a user role to SUPPORT/MODERATOR first.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-3">
          {!selected ? (
            <div className="flex h-48 items-center justify-center text-white/40">Select a staff member</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-black text-white">{selected.username}</div>
                  <div className="text-xs text-white/40">Feature matrix</div>
                </div>
                <select
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                  value={selected.role}
                  disabled={selected.role === "ADMIN"}
                  onChange={(e) => setRole(selected, e.target.value)}
                >
                  {["SUPPORT", "MODERATOR", "ADMIN"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selected.role === "ADMIN" ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  ADMIN always has full access. Permissions matrix is for SUPPORT / MODERATOR only.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {STAFF_PERMS.map((p) => {
                      const on = draft.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setDraft((d) => (on ? d.filter((x) => x !== p) : [...d, p]))
                          }
                          className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${
                            on
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                              : "border-white/10 bg-black/20 text-white/40"
                          }`}
                        >
                          {on ? "ON · " : "OFF · "}
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={save} disabled={working} className="gap-2">
                      <Save className="h-4 w-4" />
                      {working ? "Saving…" : "Save access"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDraft([])}
                      disabled={working}
                    >
                      Clear (use role defaults)
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
