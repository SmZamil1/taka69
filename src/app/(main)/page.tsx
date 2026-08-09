"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { JackpotBar } from "@/components/home/JackpotBar";
import { GameGrid } from "@/components/home/GameGrid";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Crown, Users, Zap, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const [banners, setBanners] = useState(null);
  const [jackpot, setJackpot] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(j => {
      if (j.ok) {
        setBanners(j.data.banners);
        setJackpot(j.data.jackpot);
      }
    }).catch(() => {});
  }, []);

  const quickLinks = [
    { href: "/wingo", icon: <Zap className="h-5 w-5" />, en: "WinGo", bn: "উইনগো", color: "from-amber-500 to-orange-600" },
    { href: "/vip",   icon: <Crown className="h-5 w-5" />, en: "VIP",   bn: "ভিআইপি",  color: "from-purple-600 to-violet-700" },
    { href: "/referral", icon: <Users className="h-5 w-5" />, en: "Refer", bn: "রেফার", color: "from-emerald-600 to-teal-700" },
    { href: "/wallet?tab=deposit", icon: <Gift className="h-5 w-5" />, en: "Deposit", bn: "ডিপোজিট", color: "from-rose-600 to-pink-700" },
  ];

  return (
    <div className="space-y-5 pb-20">
      <HeroCarousel banners={banners} />
      <JackpotBar jackpot={jackpot} />

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-2">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href}
            className={cn("flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-br p-3 text-white", q.color)}
          >
            {q.icon}
            <span className="text-[10px] font-bold">{t(q.en, q.bn)}</span>
          </Link>
        ))}
      </div>

      <QuickActions />
      <GameGrid />
    </div>
  );
}
