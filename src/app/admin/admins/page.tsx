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

const ROLE_DEFAULTS: Record<string, string[]> = {
  MODERATOR: ["dashboard", "users", "wallet", "moderation", "support", "games", "transactions", "reports"],
  SUPPORT: ["dashboard", "support"],
};

export default function AdminAdminsPage() {
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/admin/users?q=", { credentials: "include" });
    const j = await res.json();
    if (!j.ok) {
      setError(j.error || "Failed to load staff");
      return;
    }
    const list = (j.data.users || []).filter((u: Staff) =>
      ["SUPPORT", "MODERATOR", "ADMIN"].includes(u.role)
    );
    setStaff(list);
    // refresh selected from server so toggles stick after save
    setSelected((prev) => {
      if (!prev) return prev;
      const next = list.find((u: Staff) => u.id === prev.id) || null;
      if (next) {
        setDraft(Array.isArray(next.permissions) ? [...(next.permissions as string[])] : []);
      }
      return next;
    });
  }

  useEffect(() => {
    load();
  }, []);

  function pick(u: Staff) {
    setSelected(u);
    if (Array.isArray(u.permissions) && u.permissions.length) {
      setDraft([...u.permissions]);
    } else {
      // show role defaults as starting draft so toggles are visible
      setDraft([...(ROLE_DEFAULTS[u.role] || [])]);
    }
  }

  async function save() {
    if (!selected || selected.role === "ADMIN") return;
    setWorking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: selected.id, permissions: draft }),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success("Permissions updated — staff must refresh to apply");
        await load();
      } else {
        toast.error(j.error || "Failed");
        setError(j.error || "Save failed");
      }
    } catch (e) {
      toast.error("Network error");
      setError("Network error");
    }
    setWorking(false);
  }

  async function setRole(u: Staff, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: u.id, role, permissions: [] }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Role updated");
      await load();
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
          Toggle SUPPORT / MODERATOR features. Only ON pages appear in their sidebar and are openable.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

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
                  {Array.isArray(u.permissions) && u.permissions.length
                    ? `${u.permissions.length} custom`
                    : "role defaults"}
                </span>
              </div>
            </button>
          ))}
          {!staff.length && (
            <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-white/40">
              No staff users yet — set a user role to SUPPORT/MODERATOR first (Users & roles).
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
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={save} disabled={working} className="gap-2">
                      <Save className="h-4 w-4" />
                      {working ? "Saving…" : "Save access"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDraft([...(ROLE_DEFAULTS[selected.role] || [])])}
                      disabled={working}
                    >
                      Reset to role defaults
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        setDraft([]);
                        setWorking(true);
                        const res = await fetch("/api/admin/users", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ id: selected.id, permissions: [] }),
                        });
                        const j = await res.json();
                        if (j.ok) {
                          toast.success("Cleared — using role defaults");
                          await load();
                        } else toast.error(j.error || "Failed");
                        setWorking(false);
                      }}
                      disabled={working}
                    >
                      Clear custom
                    </Button>
                  </div>
                  <p className="text-[11px] text-white/35">
                    After save, the staff member should hard-refresh. Sidebar only shows ON features.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
