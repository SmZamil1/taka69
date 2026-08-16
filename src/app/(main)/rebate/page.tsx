"use client";

import { useState } from "react";
import { CalendarDays, FileClock, HandCoins, History } from "lucide-react";
import { AccountCard, AccountHeader, AccountTabs, EmptyState, FloatingAccountActions } from "@/components/account";

export default function RebatePage() {
  const [tab, setTab] = useState("manual");
  return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-28 text-[#173251]">
    <AccountHeader title="রিবেট সেন্টার" subtitle="আপনার রিবেট আবেদন ও ইতিহাস" />
    <div className="mx-auto max-w-lg space-y-4 pt-4">
      <AccountTabs tabs={[{ id: "manual", label: "ম্যানুয়াল রিবেট" }, { id: "history", label: "রিবেট ইতিহাস" }]} value={tab} onChange={setTab} />
      <AccountCard title={tab === "manual" ? "ম্যানুয়াল রিবেট" : "রিবেট ইতিহাস"} subtitle={tab === "manual" ? "উপলব্ধ রিবেটের জন্য আবেদন করুন" : "আপনার পূর্বের রিবেট রেকর্ড"} icon={tab === "manual" ? <HandCoins className="h-4 w-4" /> : <History className="h-4 w-4" />}>
        <div className="mb-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          <label className="text-[10px] font-bold text-[#6d879f]">শুরুর তারিখ<input type="date" className="mt-1 w-full rounded-xl border border-[#d8e5f0] bg-[#f8fbfe] px-2.5 py-2 text-xs text-[#36516a] outline-none focus:border-[#4a91d0]" /></label>
          <label className="text-[10px] font-bold text-[#6d879f]">শেষ তারিখ<input type="date" className="mt-1 w-full rounded-xl border border-[#d8e5f0] bg-[#f8fbfe] px-2.5 py-2 text-xs text-[#36516a] outline-none focus:border-[#4a91d0]" /></label>
        </div>
        <button type="button" className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f70c1] py-2.5 text-xs font-black text-white shadow-sm active:scale-[0.99]"><CalendarDays className="h-4 w-4" /> তারিখ অনুযায়ী খুঁজুন</button>
        <EmptyState icon={tab === "manual" ? FileClock : History} title={tab === "manual" ? "কোনো রিবেট পাওয়া যায়নি" : "রিবেট ইতিহাস খালি"} description="এই সময়সীমায় দেখানোর মতো কোনো রিবেট রেকর্ড নেই।" />
      </AccountCard>
      <div className="rounded-xl border border-[#dce8f2] bg-[#e6f1fb] px-3 py-2.5 text-[11px] leading-5 text-[#61809d]">রিবেট সংক্রান্ত তথ্য পাওয়া গেলে এই পৃষ্ঠায় স্বয়ংক্রিয়ভাবে দেখানো হবে।</div>
    </div>
    <FloatingAccountActions />
  </div>;
}
