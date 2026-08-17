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
            className="flex min-h-[4.6rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#dce8f2] bg-white px-2 py-3 text-[#173251] shadow-[0_7px_18px_rgba(48,89,125,0.1)] transition active:scale-95 hover:border-[#8bbce8] hover:bg-[#f8fbfe]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1dc] text-[#d89224]">
              <Icon className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="text-center text-[10px] font-black leading-tight text-[#294765]">{t(a.en, a.bn)}</span>
          </Link>
        );
      })}
    </div>
  );
}
