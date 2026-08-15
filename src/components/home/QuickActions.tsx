"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { ArrowDownToLine, ArrowUpFromLine, Coins, BookOpen } from "lucide-react";

export function QuickActions() {
  const t = useLang((s) => s.t);

  const actions = [
    {
      href: "/wallet?tab=deposit",
      icon: ArrowDownToLine,
      en: "Deposit",
      bn: "ডিপোজিট",
    },
    {
      href: "/wallet?tab=withdraw",
      icon: ArrowUpFromLine,
      en: "Withdraw",
      bn: "উত্তোলন করুন",
    },
    {
      href: "/vip",
      icon: Coins,
      en: "Cashback",
      bn: "ক্যাশব্যাক",
    },
    {
      href: "/rewards",
      icon: BookOpen,
      en: "Mission",
      bn: "মিশন",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-200 to-yellow-500 px-1 py-3 text-emerald-950 shadow-[0_6px_16px_rgba(251,191,36,0.25)] active:scale-95 transition"
          >
            <Icon className="h-5 w-5" strokeWidth={2.4} />
            <span className="text-[10px] font-black leading-tight text-center">{t(a.en, a.bn)}</span>
          </Link>
        );
      })}
    </div>
  );
}
