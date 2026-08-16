"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { ArrowDownToLine, ArrowUpFromLine, Coins, BookOpen } from "lucide-react";

export function QuickActions() {
  const t = useLang((s) => s.t);

  const actions = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "ডিপোজিট" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন করুন" },
    { href: "/vip", icon: Coins, en: "Cashback", bn: "ক্যাশব্যাক" },
    { href: "/rewards", icon: BookOpen, en: "Mission", bn: "মিশন" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-[1.25rem] border border-emerald-100/10 bg-gradient-to-br from-[#0d3025]/90 to-[#071a14]/90 px-2 py-3 text-emerald-50 shadow-card transition active:scale-95 hover:border-emerald-300/30 hover:bg-emerald-400/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-300/15 text-gold-300 ring-1 ring-gold-300/15">
              <Icon className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="text-center text-[10px] font-black leading-tight text-emerald-50/90">{t(a.en, a.bn)}</span>
          </Link>
        );
      })}
    </div>
  );
}
