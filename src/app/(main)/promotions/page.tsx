"use client";

import { useLang } from "@/hooks/useLang";
import { Gift, CalendarCheck, Users, Target } from "lucide-react";

const promos = [
  {
    en: "Welcome 10,000 TK",
    bn: "স্বাগতম ১০,০০০ টিসি",
    descEn: "Free play-money coins on every new account.",
    descBn: "প্রতিটি নতুন অ্যাকাউন্টে ফ্রি প্লে-মানি কয়েন।",
    icon: Gift,
  },
  {
    en: "Daily Login 500 TK",
    bn: "দৈনিক লগইন ৫০০ টিসি",
    descEn: "Claim once per UTC day from Wallet.",
    descBn: "ওয়ালেট থেকে প্রতি UTC দিনে একবার নিন।",
    icon: CalendarCheck,
  },
  {
    en: "Referral 500 TK",
    bn: "রেফারেল ৫০০ টিসি",
    descEn: "Earn when a friend signs up with your code.",
    descBn: "আপনার কোডে বন্ধু সাইনআপ করলে পাবেন।",
    icon: Users,
  },
  {
    en: "Missions",
    bn: "মিশন",
    descEn: "Complete challenges for extra TK.",
    descBn: "চ্যালেঞ্জ শেষ করে অতিরিক্ত টিসি নিন।",
    icon: Target,
  },
];

export default function PromotionsPage() {
  const t = useLang((s) => s.t);
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-black text-gold-400">{t("Promotions", "প্রমোশন")}</h1>
      <p className="text-xs text-emerald-200/60">
        {t("All rewards are virtual TK only.", "সব পুরস্কার শুধু ভার্চুয়াল TK।")}
      </p>
      {promos.map((p, idx) => {
        const Icon = p.icon;
        return (
          <div
            key={p.en}
            className="card flex gap-3 animate-rise"
            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/20 to-emerald-900 text-gold-300 shadow-gold">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold">{t(p.en, p.bn)}</div>
              <p className="text-sm text-emerald-100/70">{t(p.descEn, p.descBn)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
