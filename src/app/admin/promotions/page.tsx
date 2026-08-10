"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";

type Promo = { id: string; titleEn: string; titleBn: string; bodyEn: string; bodyBn: string; href: string | null; active: boolean; createdAt: string };

export default function AdminPromosPage() {
  const toast = useToast();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titleEn: "", titleBn: "", bodyEn: "", bodyBn: "", href: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/promotions", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setPromos(json.data.promos);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.titleEn || !form.bodyEn) { toast.error("Fill EN title & body"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/promotions", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.ok) { toast.success("Promo created & pushed!"); setShowForm(false); setForm({ titleEn:"",titleBn:"",bodyEn:"",bodyBn:"",href:"" }); load(); }
    else toast.error(json.error);
    setSaving(false);
  }

  async function del(id: string) {
    const res = await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE", credentials: "include" });
    const json = await res.json();
    if (json.ok) { toast.success("Deleted"); setPromos(p => p.filter(x => x.id !== id)); }
    else toast.error(json.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-amber-300">Promotions</h1>
        <Button variant="gold" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> New Promo
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 space-y-3">
          <h2 className="font-bold text-amber-300 text-sm">Create Promotion (pushes as global notification)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-white/40">Title EN</label><Input value={form.titleEn} onChange={e => setForm(f => ({...f, titleEn: e.target.value}))} placeholder="Welcome Bonus" /></div>
            <div><label className="text-[10px] text-white/40">Title BN</label><Input value={form.titleBn} onChange={e => setForm(f => ({...f, titleBn: e.target.value}))} placeholder="স্বাগতম বোনাস" /></div>
            <div><label className="text-[10px] text-white/40">Body EN</label><Input value={form.bodyEn} onChange={e => setForm(f => ({...f, bodyEn: e.target.value}))} placeholder="Deposit now to get bonus!" /></div>
            <div><label className="text-[10px] text-white/40">Body BN</label><Input value={form.bodyBn} onChange={e => setForm(f => ({...f, bodyBn: e.target.value}))} placeholder="এখনই ডিপোজিট করুন!" /></div>
            <div className="col-span-2"><label className="text-[10px] text-white/40">Link (optional)</label><Input value={form.href} onChange={e => setForm(f => ({...f, href: e.target.value}))} placeholder="/wallet?tab=deposit" /></div>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" disabled={saving} onClick={create}>{saving ? "Creating..." : "Create & Push to All"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-white/40">Loading...</div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white">{p.titleEn}</div>
                  <div className="text-xs text-white/50 mt-0.5">{p.bodyEn}</div>
                  {p.href && <div className="text-[10px] text-amber-300/60 mt-1">→ {p.href}</div>}
                  <div className="text-[10px] text-white/25 mt-1">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => del(p.id)} className="rounded-lg p-2 hover:bg-rose-500/15 text-rose-400/60 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!promos.length && <div className="py-8 text-center text-white/40">No promotions yet</div>}
        </div>
      )}
    </div>
  );
}
