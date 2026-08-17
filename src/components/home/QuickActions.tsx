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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="reference-quick-action flex min-h-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 transition active:scale-95"
          >
            <span className="reference-quick-action-icon flex h-8 w-8 items-center justify-center rounded-full">
              <Icon className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="reference-quick-action-label text-center text-[10px] font-black leading-tight">{t(a.en, a.bn)}</span>
          </Link>
        );
      })}
    </div>
  );
}
