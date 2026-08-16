"use client";

import { useLang } from "@/hooks/useLang";
import { CalendarCheck, Gift, Target, Users } from "lucide-react";
import { AccountCard, AccountHeader, AccountHero, FloatingAccountActions } from "@/components/account";

const promos = [
  { en: "Welcome 10,000 TK", bn: "স্বাগতম ১০,০০০ টিসি", descEn: "Free play-money coins on every new account.", descBn: "প্রতিটি নতুন অ্যাকাউন্টে ফ্রি প্লে-মানি কয়েন।", icon: Gift },
  { en: "Daily Login 500 TK", bn: "দৈনিক লগইন ৫০০ টিসি", descEn: "Claim once per UTC day from Wallet.", descBn: "ওয়ালেট থেকে প্রতি UTC দিনে একবার নিন।", icon: CalendarCheck },
  { en: "Referral 500 TK", bn: "রেফারেল ৫০০ টিসি", descEn: "Earn when a friend signs up with your code.", descBn: "আপনার কোডে বন্ধু সাইনআপ করলে পাবেন।", icon: Users },
  { en: "Missions", bn: "মিশন", descEn: "Complete challenges for extra TK.", descBn: "চ্যালেঞ্জ শেষ করে অতিরিক্ত টিসি নিন।", icon: Target },
];

export default function PromotionsPage() {
  const t = useLang((s) => s.t);
  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-3">
        <AccountHeader title={t("Promotions", "প্রমোশন")} subtitle={t("Simple ways to collect virtual TK", "ভার্চুয়াল TK পাওয়ার সহজ উপায়")} />
        <AccountHero username={t("Promotion Center", "প্রমোশন কেন্দ্র")} badge={t("Rewards", "পুরস্কার")} eyebrow={t("Special offers", "বিশেষ অফার")} description={t("All rewards are virtual TK only.", "সব পুরস্কার শুধু ভার্চুয়াল TK।")} />
        <AccountCard title={t("Available rewards", "উপলভ্য পুরস্কার")} subtitle={t("Explore every offer in one place", "সব অফার এক জায়গায় দেখুন")} icon={<Gift className="h-4 w-4" />}>
          <div className="space-y-2">{promos.map((p, idx) => { const Icon = p.icon; return <div key={p.en} className="flex gap-3 rounded-xl border border-[#e1ebf4] bg-[#f8fbfe] p-3 animate-rise" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "backwards" }}><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fff0c9] to-[#e8f2fb] text-[#df961f]"><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="font-black text-[#173251]">{t(p.en, p.bn)}</div><p className="mt-0.5 text-sm leading-5 text-[#718aa1]">{t(p.descEn, p.descBn)}</p></div></div>; })}</div>
        </AccountCard>
      </div>
      <FloatingAccountActions />
    </div>
  );
}
