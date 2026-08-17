"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, WalletCards } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/hooks/useAuth";

type Method = { id: string; name: string; logo?: string; withdrawEnabled?: boolean; enabled?: boolean };

export default function BindWalletPage() {
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [methods, setMethods] = useState<Method[]>([]);
  const [method, setMethod] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/request", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data?.paymentConfig?.methods || []).filter((m: Method) => m.enabled !== false && m.withdrawEnabled !== false);
        setMethods(list);
        if (list[0]) setMethod(list[0].id);
      })
      .catch(() => {});
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !method || !accountName.trim() || !accountNo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wallet/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ method, accountName, accountNo }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || t("Could not bind wallet", "ওয়ালেট বাঁধা যায়নি"));
        return;
      }
      toast.success(t("Wallet added", "ওয়ালেট সফলভাবে যোগ হয়েছে"));
      router.push("/wallet/cards");
    } catch {
      toast.error(t("Network error", "নেটওয়ার্ক সমস্যা"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100dvh-5rem)] bg-[#f7f7f7] px-3 pb-24 text-[#171717]">
      <header className="-mx-3 flex items-center gap-3 bg-[#121212] px-4 py-4 text-white">
        <Link href="/wallet?tab=withdraw" className="rounded-full p-1" aria-label="Back"><ArrowLeft className="h-6 w-6" /></Link>
        <h1 className="flex-1 text-center text-lg font-black">{t("Bind e-wallet", "ই-ওয়ালেট বাঁধুন")}</h1>
        <span className="w-7" />
      </header>
      <main className="mx-auto max-w-lg space-y-4 py-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff3d6] text-[#c9a227]"><WalletCards className="h-6 w-6" /></div>
            <div><h2 className="font-black">{t("Add a withdrawal wallet", "উত্তোলনের জন্য ওয়ালেট যোগ করুন")}</h2><p className="text-xs text-black/50">{t("Use an account owned by you.", "আপনার নিজের অ্যাকাউন্ট ব্যবহার করুন।")}</p></div>
          </div>
        </section>
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div>
            <div className="mb-2 text-sm font-black">{t("Wallet type", "ওয়ালেটের ধরন")}</div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((item) => <button key={item.id} type="button" onClick={() => setMethod(item.id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold ${method === item.id ? "border-[#c9a227] bg-[#fff7df] text-[#8a6915]" : "border-black/10 bg-white"}`}>
                {item.logo && <img src={item.logo} alt="" className="h-7 w-7 rounded bg-white object-contain" />}{item.name}{method === item.id && <CheckCircle2 className="h-4 w-4" />}
              </button>)}
            </div>
          </div>
          <label className="block text-sm font-bold">{t("Recipient full name", "প্রাপকের পূর্ণ নাম")}
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} required placeholder={t("* Enter full name", "* প্রাপকের পূর্ণ নাম লিখুন")} className="mt-2 min-h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-base outline-none focus:border-[#c9a227]" />
          </label>
          <label className="block text-sm font-bold">{t("Wallet account number", "ওয়ালেট অ্যাকাউন্ট নম্বর")}
            <input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required inputMode="tel" placeholder={t("* Enter account number", "* অ্যাকাউন্ট নম্বর লিখুন")} className="mt-2 min-h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-3 text-base outline-none focus:border-[#c9a227]" />
          </label>
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">{t("Wallet binding is saved immediately. Admin may block an account if the details are invalid.", "ওয়ালেট যোগ হওয়ার পরই সেভ হবে। তথ্য ভুল হলে অ্যাডমিন অ্যাকাউন্ট ব্লক করতে পারেন।")}</p>
          <button type="submit" disabled={saving || !method} className="min-h-12 w-full rounded-full bg-[#c9a227] px-4 text-sm font-black text-[#171717] disabled:opacity-40">{saving ? t("Saving...", "সেভ হচ্ছে...") : t("Add wallet", "ওয়ালেট যোগ করুন")}</button>
        </form>
      </main>
    </div>
  );
}
