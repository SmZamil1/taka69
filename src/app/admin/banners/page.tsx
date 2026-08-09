"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Banner = {
  id: string | number;
  titleEn: string;
  titleBn: string;
  subtitleEn?: string;
  subtitleBn?: string;
  image?: string;
  href?: string;
  color?: string;
};

type Popup = {
  enabled: boolean;
  imageUrl: string;
  href: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  showOncePerSession: boolean;
};

const emptyBanner = (): Banner => ({
  id: `b_${Date.now()}`,
  titleEn: "New banner",
  titleBn: "নতুন ব্যানার",
  subtitleEn: "Tap to open",
  subtitleBn: "খুলতে ট্যাপ করুন",
  image: "/banners/welcome.jpg",
  href: "/wallet",
  color: "from-emerald-700 to-green-950",
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dataUrl, kind: "banner" }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Upload failed");
  return json.data.url as string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [popup, setPopup] = useState<Popup>({
    enabled: false,
    imageUrl: "/banners/welcome.jpg",
    href: "/promotions",
    titleEn: "Welcome offer",
    titleBn: "স্বাগতম অফার",
    bodyEn: "Deposit and get admin bonus on approval.",
    bodyBn: "ডিপোজিট করুন — অনুমোদনে অ্যাডমিন বোনাস।",
    showOncePerSession: true,
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) {
          setErr(j.error || "Failed to load config");
          return;
        }
        const c = j.data.config;
        setBanners(Array.isArray(c.banners) ? (c.banners as Banner[]) : []);
        const p = c.popupConfig || {};
        setPopup({
          enabled: !!p.enabled,
          imageUrl: p.imageUrl || "/banners/welcome.jpg",
          href: p.href || "/promotions",
          titleEn: p.titleEn || "Welcome offer",
          titleBn: p.titleBn || "স্বাগতম অফার",
          bodyEn: p.bodyEn || "",
          bodyBn: p.bodyBn || "",
          showOncePerSession: p.showOncePerSession !== false,
        });
      })
      .catch(() => setErr("Network error loading config"))
      .finally(() => setLoading(false));
  }, []);

  function updateBanner(i: number, patch: Partial<Banner>) {
    setBanners((list) => list.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  async function onBannerImage(i: number, file?: File | null) {
    if (!file) return;
    try {
      setMsg("Uploading…");
      const url = await uploadImage(file);
      updateBanner(i, { image: url });
      setMsg("Image uploaded");
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    }
  }

  async function onPopupImage(file?: File | null) {
    if (!file) return;
    try {
      setMsg("Uploading popup image…");
      const url = await uploadImage(file);
      setPopup((p) => ({ ...p, imageUrl: url }));
      setMsg("Popup image uploaded");
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    }
  }

  async function save() {
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const payload = {
        banners: banners.map((b) => ({
          ...b,
          id: String(b.id),
          titleEn: b.titleEn || "Banner",
          titleBn: b.titleBn || "ব্যানার",
          image: b.image || "",
          href: b.href || "/",
        })),
        popupConfig: {
          enabled: !!popup.enabled,
          imageUrl: popup.imageUrl || "",
          href: popup.href || "/",
          titleEn: popup.titleEn || "Promotion",
          titleBn: popup.titleBn || "প্রমোশন",
          bodyEn: popup.bodyEn || "",
          bodyBn: popup.bodyBn || "",
          showOncePerSession: popup.showOncePerSession !== false,
        },
      };
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "Save failed");
      } else {
        setMsg("Saved banners + launch popup. Open home (new session) to preview popup.");
        // refresh from server
        const g = await fetch("/api/admin/config", { credentials: "include", cache: "no-store" }).then((r) => r.json());
        if (g.ok) {
          setBanners(Array.isArray(g.data.config.banners) ? g.data.config.banners : banners);
          const p = g.data.config.popupConfig || payload.popupConfig;
          setPopup({
            enabled: !!p.enabled,
            imageUrl: p.imageUrl || "",
            href: p.href || "/",
            titleEn: p.titleEn || "",
            titleBn: p.titleBn || "",
            bodyEn: p.bodyEn || "",
            bodyBn: p.bodyBn || "",
            showOncePerSession: p.showOncePerSession !== false,
          });
        }
      }
    } catch {
      setErr("Network error");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="p-6 text-sm text-white/50">Loading banners…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-16">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="rounded-full border border-white/10 bg-white/5 p-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Banners & Popup</h1>
          <p className="text-xs text-white/45">Home carousel + launch popup (image + URL)</p>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-amber-300">Home banners</h2>
          <Button size="sm" variant="soft" className="gap-1" onClick={() => setBanners((b) => [...b, emptyBanner()])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {banners.map((b, i) => (
          <div key={String(b.id) + i} className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/50">#{i + 1}</span>
              <button
                type="button"
                className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-500/10"
                onClick={() => setBanners((list) => list.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={b.titleEn} onChange={(e) => updateBanner(i, { titleEn: e.target.value })} placeholder="Title EN" />
              <Input value={b.titleBn} onChange={(e) => updateBanner(i, { titleBn: e.target.value })} placeholder="Title BN" />
              <Input value={b.subtitleEn || ""} onChange={(e) => updateBanner(i, { subtitleEn: e.target.value })} placeholder="Subtitle EN" />
              <Input value={b.subtitleBn || ""} onChange={(e) => updateBanner(i, { subtitleBn: e.target.value })} placeholder="Subtitle BN" />
              <Input value={b.image || ""} onChange={(e) => updateBanner(i, { image: e.target.value })} placeholder="Image URL /path or https://" />
              <Input value={b.href || ""} onChange={(e) => updateBanner(i, { href: e.target.value })} placeholder="Link URL e.g. /wallet" />
              <Input value={b.color || ""} onChange={(e) => updateBanner(i, { color: e.target.value })} placeholder="Gradient e.g. from-rose-700 to-red-950" />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/70">
                <Upload className="h-3.5 w-3.5" /> Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onBannerImage(i, e.target.files?.[0])} />
              </label>
            </div>
            {b.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.image} alt="" className="mt-1 h-24 w-full rounded-lg object-cover opacity-90" />
            )}
          </div>
        ))}
        {!banners.length && <p className="text-sm text-white/40">No banners yet. Add one.</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
        <h2 className="font-bold text-amber-300">Launch popup</h2>
        <p className="text-[11px] text-white/45">
          Enable + save, then open the home page in a fresh browser tab/session to see it.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={popup.enabled}
            onChange={(e) => setPopup((p) => ({ ...p, enabled: e.target.checked }))}
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={popup.showOncePerSession}
            onChange={(e) => setPopup((p) => ({ ...p, showOncePerSession: e.target.checked }))}
          />
          Show once per session
        </label>
        <Input value={popup.imageUrl} onChange={(e) => setPopup((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Popup image URL" />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/70">
          <Upload className="h-3.5 w-3.5" /> Upload popup image
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPopupImage(e.target.files?.[0])} />
        </label>
        <Input value={popup.href} onChange={(e) => setPopup((p) => ({ ...p, href: e.target.value }))} placeholder="Popup link URL" />
        <Input value={popup.titleEn} onChange={(e) => setPopup((p) => ({ ...p, titleEn: e.target.value }))} placeholder="Title EN" />
        <Input value={popup.titleBn} onChange={(e) => setPopup((p) => ({ ...p, titleBn: e.target.value }))} placeholder="Title BN" />
        <Input value={popup.bodyEn} onChange={(e) => setPopup((p) => ({ ...p, bodyEn: e.target.value }))} placeholder="Body EN" />
        <Input value={popup.bodyBn} onChange={(e) => setPopup((p) => ({ ...p, bodyBn: e.target.value }))} placeholder="Body BN" />
        {popup.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imageUrl} alt="" className="h-28 w-full rounded-lg object-cover" />
        )}
      </section>

      <Button size="lg" className="w-full gap-2" onClick={save} disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save banners & popup"}
      </Button>
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}
    </div>
  );
}
