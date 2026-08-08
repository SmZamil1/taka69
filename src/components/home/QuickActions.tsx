"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { CreditCard, Landmark, Gift, ListChecks, type LucideIcon } from "lucide-react";

const actions: { href: string; en: string; bn: string; icon: LucideIcon; tone: string }[] = [
  { href: "/wallet?tab=deposit", en: "Deposit", bn: "ডিপোজিট", icon: CreditCard, tone: "from-emerald-500/30 to-emerald-900/60" },
  { href: "/wallet?tab=withdraw", en: "Withdraw", bn: "উত্তোলন", icon: Landmark, tone: "from-amber-500/25 to-amber-900/50" },
  { href: "/rewards", en: "Rewards", bn: "পুরস্কার", icon: Gift, tone: "from-fuchsia-500/25 to-purple-900/50" },
  { href: "/rewards?tab=missions", en: "Missions", bn: "মিশন", icon: ListChecks, tone: "from-sky-500/25 to-blue-900/50" },
];

export function QuickActions() {
  const t = useLang((s) => s.t);
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.en}
            href={a.href}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-gradient-to-b ${a.tone} px-1 py-3 text-center shadow-lg backdrop-blur transition-transform duration-200 hover:scale-[1.04] active:scale-95`}
          >
            <Icon className="h-5 w-5 text-white drop-shadow" strokeWidth={1.75} />
            <span className="text-[10px] font-bold leading-tight text-white">{t(a.en, a.bn)}</span>
          </Link>
        );
      })}
    </div>
  );
}
