"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Mission = {
  id: string;
  code: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  target: number;
  reward: number;
  active: boolean;
  sortOrder: number;
  _count?: { progress: number };
};

const EMPTY: Omit<Mission, "id" | "_count"> = {
  code: "",
  titleEn: "",
  titleBn: "",
  descriptionEn: "",
  descriptionBn: "",
  target: 1,
  reward: 100,
  active: true,
  sortOrder: 0,
};

export default function AdminMissionsPage() {
  const toast = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchMissions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", { credentials: "include" });
      const json = await res.json();
      if (json.ok) setMissions(json.data.missions);
      else toast.error("Failed to load missions");
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  useEffect(() => { fetchMissions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startCreate() {
    setEditId(null);
    setForm(EMPTY);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(m: Mission) {
    setEditId(m.id);
    setForm({
      code: m.code,
      titleEn: m.titleEn,
      titleBn: m.titleBn,
      descriptionEn: m.descriptionEn,
      descriptionBn: m.descriptionBn,
      target: m.target,
      reward: m.reward,
      active: m.active,
      sortOrder: m.sortOrder,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.code || !form.titleEn || !form.titleBn || !form.descriptionEn || !form.descriptionBn) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const payload = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/admin/missions", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error("Save failed", json.error);
        setSaving(false);
        return;
      }
      toast.success(editId ? "Mission updated ✓" : "Mission created ✓");
      cancelForm();
      await fetchMissions();
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function toggleActive(m: Mission) {
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: m.id, active: !m.active }),
      });
      const json = await res.json();
      if (json.ok) {
        setMissions((prev) => prev.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)));
        toast.success(m.active ? "Mission disabled" : "Mission enabled");
      } else {
        toast.error("Failed", json.error);
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function deleteMission(id: string) {
    try {
      const res = await fetch(`/api/admin/missions?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Mission deleted");
        setMissions((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error("Delete failed", json.error);
      }
    } catch {
      toast.error("Network error");
    }
    setConfirmDelete(null);
  }

  async function moveSortOrder(m: Mission, dir: "up" | "down") {
    const newOrder = dir === "up" ? m.sortOrder - 1 : m.sortOrder + 1;
    try {
      await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: m.id, sortOrder: newOrder }),
      });
      await fetchMissions();
    } catch {
      toast.error("Network error");
    }
  }

  const f = (k: keyof typeof EMPTY, v: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-amber-300">Missions</h1>
          <p className="mt-1 text-xs text-white/50">
            Create, edit, reorder, or disable missions. Changes go live immediately.
          </p>
        </div>
        {!showForm && (
          <Button variant="gold" className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" /> New Mission
          </Button>
        )}
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5 space-y-4">
          <h2 className="font-bold text-amber-300 text-sm uppercase tracking-wider">
            {editId ? "✏️ Edit Mission" : "➕ New Mission"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">
                Code (UPPER_SNAKE) {editId && <span className="text-white/20 normal-case">— locked after creation</span>}
              </label>
              <Input
                placeholder="e.g. WIN_10"
                value={form.code}
                onChange={(e) => f("code", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                disabled={!!editId}
                className={editId ? "opacity-40 cursor-not-allowed" : ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Title (EN)</label>
              <Input placeholder="Play 10 Rounds" value={form.titleEn} onChange={(e) => f("titleEn", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Title (BN)</label>
              <Input placeholder="১০ রাউন্ড খেলুন" value={form.titleBn} onChange={(e) => f("titleBn", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Description (EN)</label>
              <Input placeholder="Play any 10 bets" value={form.descriptionEn} onChange={(e) => f("descriptionEn", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Description (BN)</label>
              <Input placeholder="যেকোনো গেমে ১০টি বেট করুন" value={form.descriptionBn} onChange={(e) => f("descriptionBn", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Target (count)</label>
              <Input
                type="number"
                min={1}
                value={form.target}
                onChange={(e) => f("target", parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Reward (TK)</label>
              <Input
                type="number"
                min={1}
                value={form.reward}
                onChange={(e) => f("reward", parseFloat(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-white/40 uppercase tracking-wider">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => f("sortOrder", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="text-[11px] text-white/40 uppercase tracking-wider">Active</label>
              <button
                type="button"
                onClick={() => f("active", !form.active)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.active ? "bg-emerald-500" : "bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    form.active ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className="text-xs text-white/40">{form.active ? "Visible to users" : "Hidden"}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="gold" disabled={saving} onClick={save} className="gap-2">
              {saving ? "Saving…" : editId ? "Update Mission" : "Create Mission"}
            </Button>
            <Button variant="ghost" onClick={cancelForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Missions List ── */}
      {loading ? (
        <div className="py-12 text-center text-sm text-white/40">Loading missions…</div>
      ) : missions.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/40">
          No missions yet.{" "}
          <button className="text-amber-300 underline" onClick={startCreate}>Create one</button>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((m, idx) => (
            <div
              key={m.id}
              className={cn(
                "rounded-2xl border p-4 transition-all",
                m.active
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-white/5 bg-white/[0.02] opacity-55"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Sort buttons */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    onClick={() => moveSortOrder(m, "up")}
                    disabled={idx === 0}
                    className="rounded p-0.5 hover:bg-white/10 disabled:opacity-20 transition"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[9px] text-white/20">{m.sortOrder}</span>
                  <button
                    onClick={() => moveSortOrder(m, "down")}
                    disabled={idx === missions.length - 1}
                    className="rounded p-0.5 hover:bg-white/10 disabled:opacity-20 transition"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60">{m.code}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      m.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
                    )}>
                      {m.active ? "Active" : "Inactive"}
                    </span>
                    {m._count !== undefined && (
                      <span className="text-[10px] text-white/30">{m._count.progress} claimed</span>
                    )}
                  </div>
                  <div className="mt-1.5 font-bold text-white text-[14px] leading-snug">
                    {m.titleEn} <span className="text-white/40 font-normal">/ {m.titleBn}</span>
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">{m.descriptionEn}</div>
                  <div className="mt-2 flex flex-wrap gap-4 text-[11px]">
                    <span className="text-white/40">Target: <strong className="text-white">{m.target}</strong></span>
                    <span className="text-white/40">Reward: <strong className="text-amber-300">+{m.reward} TK</strong></span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-3 flex items-center gap-2 flex-wrap pl-8">
                <button
                  onClick={() => startEdit(m)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/12 transition"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(m)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    m.active
                      ? "bg-white/8 text-white/60 hover:bg-white/12"
                      : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  )}
                >
                  {m.active ? (
                    <><XCircle className="h-3.5 w-3.5" /> Disable</>
                  ) : (
                    <><CheckCircle className="h-3.5 w-3.5" /> Enable</>
                  )}
                </button>
                {confirmDelete === m.id ? (
                  <>
                    <button
                      onClick={() => deleteMission(m.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-500/25 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/40 transition"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-white/40 hover:text-white px-2 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-rose-400/70 hover:bg-rose-500/15 hover:text-rose-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
