"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, WalletCards } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";

type Card = { id: string; method: string; label: string; accountNo: string; accountName?: string | null; status?: string; rejectionReason?: string | null; createdAt: string };

export default function WalletCardsPage() {
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/cards", { credentials: "include" });
      const json = await res.json();
      if (json.ok) setCards(json.data.cards || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const res = await fetch(`/api/wallet/cards?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    const json = await res.json();
    if (json.ok) { setCards((value) => value.filter((card) => card.id !== id)); toast.success(t("Removed", "সরানো হয়েছে")); }
    else toast.error(json.error || t("Could not remove", "সরানো যায়নি"));
  }

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100dvh-5rem)] bg-[#f7f7f7] px-3 pb-24 text-[#171717]">
      <header className="-mx-3 flex items-center gap-3 bg-[#121212] px-4 py-4 text-white"><Link href="/profile" className="rounded-full p-1"><ArrowLeft className="h-6 w-6" /></Link><h1 className="flex-1 text-center text-lg font-black">{t("My cards", "আমার কার্ড")}</h1><span className="w-7" /></header>
      <main className="mx-auto max-w-lg space-y-4 py-4">
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div><div className="text-xs text-black/50">{t("Bound e-wallets", "আবদ্ধ ই-ওয়ালেট")}</div><div className="mt-1 text-xl font-black">{cards.length}/4</div></div><WalletCards className="h-8 w-8 text-[#c9a227]" /></div>
        {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-black/50">{t("Loading...", "লোড হচ্ছে...")}</div> : cards.length ? <div className="space-y-3">{cards.map((card) => <div key={card.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7df]"><WalletCards className="h-6 w-6 text-[#c9a227]" /></div><div className="min-w-0 flex-1"><div className="font-black">{card.label}</div><div className="text-sm font-bold tracking-wide text-black/70">{card.accountNo}</div>{card.accountName && <div className="truncate text-xs text-black/45">{card.accountName}</div>}<div className="mt-1 text-[10px] font-bold text-black/40">{card.status || "ACTIVE"} · {new Date(card.createdAt).toLocaleDateString()}</div>{card.rejectionReason && <div className="mt-1 text-[10px] text-rose-600">{card.rejectionReason}</div>}</div><button type="button" onClick={() => remove(card.id)} className="rounded-full p-2 text-rose-500" aria-label={t("Remove", "সরান")}><Trash2 className="h-5 w-5" /></button></div>)}</div> : <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center"><WalletCards className="mx-auto h-10 w-10 text-black/25" /><p className="mt-3 font-black">{t("No bound e-wallet", "কোনো ই-ওয়ালেট বাঁধা নেই")}</p><p className="mt-1 text-xs text-black/45">{t("Add one to withdraw faster.", "দ্রুত উত্তোলনের জন্য একটি যোগ করুন।")}</p></div>}
        <Link href="/wallet/bind" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c9a227] text-sm font-black"><Plus className="h-5 w-5" />{t("Add new wallet", "নতুন ওয়ালেট যোগ করুন")}</Link>
      </main>
    </div>
  );
}
