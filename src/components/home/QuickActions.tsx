"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";
import { Wallet, Zap, Crown, Users, Trophy } from "lucide-react";

export function QuickActions() {
  const t = useLang((s) => s.t);
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const actions = [
    {
      href: "/wallet?tab=deposit",
      icon: <Wallet className="h-5 w-5 text-emerald-400" />,
      titleEn: "Deposit", titleBn: "ডিপোজিট",
      subEn: "Add TK balance", subBn: "TK যোগ করুন",
      bg: "border-emerald-700/30 bg-emerald-900/20",
    },
    {
      href: "/wingo",
      icon: <Zap className="h-5 w-5 text-amber-400" />,
      titleEn: "WinGo", titleBn: "উইনগো",
      subEn: "1-min rounds", subBn: "১-মিনিট রাউন্ড",
      bg: "border-amber-700/30 bg-amber-900/20",
    },
    {
      href: "/vip",
      icon: <Crown className="h-5 w-5 text-purple-400" />,
      titleEn: "VIP", titleBn: "ভিআইপি",
      subEn: `Level ${user.vipLevel ?? 0}`, subBn: `লেভেল ${user.vipLevel ?? 0}`,
      bg: "border-purple-700/30 bg-purple-900/20",
    },
    {
      href: "/referral",
      icon: <Users className="h-5 w-5 text-cyan-400" />,
      titleEn: "Refer", titleBn: "রেফার",
      subEn: "Earn 3%", subBn: "৩% আয়",
      bg: "border-cyan-700/30 bg-cyan-900/20",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">{t("Quick Actions","কুইক একশন")}</h3>
        <span className="text-xs text-white/40">{formatCoins(user.balance)} TK</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}
            className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 text-center transition hover:scale-105 ${a.bg}`}>
            {a.icon}
            <div className="text-[11px] font-bold text-white">{t(a.titleEn, a.titleBn)}</div>
            <div className="text-[9px] text-white/40">{t(a.subEn, a.subBn)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
