"use client";

import { useLang } from "@/hooks/useLang";

const promos = [
  {
    en: "Welcome 10,000 TC",
    bn: "স্বাগতম ১০,০০০ টিসি",
    descEn: "Free play-money coins on every new account.",
    descBn: "প্রতিটি নতুন অ্যাকাউন্টে ফ্রি প্লে-মানি কয়েন।",
    emoji: "🎁",
  },
  {
    en: "Daily Login 500 TC",
    bn: "দৈনিক লগইন ৫০০ টিসি",
    descEn: "Claim once per UTC day from Wallet.",
    descBn: "ওয়ালেট থেকে প্রতি UTC দিনে একবার নিন।",
    emoji: "📅",
  },
  {
    en: "Referral 500 TC",
    bn: "রেফারেল ৫০০ টিসি",
    descEn: "Earn when a friend signs up with your code.",
    descBn: "আপনার কোডে বন্ধু সাইনআপ করলে পাবেন।",
    emoji: "🤝",
  },
  {
    en: "Missions",
    bn: "মিশন",
    descEn: "Complete challenges for extra TC.",
    descBn: "চ্যালেঞ্জ শেষ করে অতিরিক্ত টিসি নিন।",
    emoji: "🎯",
  },
];

export default function PromotionsPage() {
  const t = useLang((s) => s.t);
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-black text-gold-400">{t("Promotions", "প্রমোশন")}</h1>
      <p className="text-xs text-emerald-200/60">
        {t("All rewards are virtual TC only.", "সব পুরস্কার শুধু ভার্চুয়াল TC।")}
      </p>
      {promos.map((p) => (
        <div key={p.en} className="card flex gap-3">
          <div className="text-3xl">{p.emoji}</div>
          <div>
            <div className="font-bold">{t(p.en, p.bn)}</div>
            <p className="text-sm text-emerald-100/70">{t(p.descEn, p.descBn)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
