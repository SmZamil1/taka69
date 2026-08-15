"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { JackpotBar } from "@/components/home/JackpotBar";
import { GameGrid } from "@/components/home/GameGrid";
import { useLang } from "@/hooks/useLang";
import { Bell, Mail } from "lucide-react";

export default function HomePage() {
  const t = useLang((s) => s.t);
  const [banners, setBanners] = useState(null);
  const [jackpot, setJackpot] = useState<number | null>(null);
  const [marquee, setMarquee] = useState("৳7,777 · প্রথম জমা বোনাস সর্বোচ্চ ৳১৮,৮৮৮ · প্রতি শুক্রবার সুপার বোনাস");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setBanners(j.data.banners);
          setJackpot(j.data.jackpot);
          if (j.data.announcements?.[0]) {
            const a = j.data.announcements[0];
            setMarquee(a.titleBn || a.titleEn || marquee);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 pb-24">
      {/* Marquee notice bar — JETA7 style */}
      <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-gradient-to-r from-emerald-950 to-emerald-900 px-3 py-2 shadow-inner">
        <Bell className="h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-[12px] font-semibold text-amber-100/90">
            ✨ {marquee} 👑 {t("First deposit bonus up to ৳18,888", "প্রথম জমা বোনাস সর্বোচ্চ ৳১৮,৮৮৮")} 🎉
          </div>
        </div>
        <Link
          href="/promotions"
          className="relative shrink-0 rounded-full bg-amber-400/15 p-1.5 text-amber-200"
          aria-label="Inbox"
        >
          <Mail className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
        </Link>
      </div>

      <HeroCarousel banners={banners} />
      <QuickActions />
      <JackpotBar jackpot={jackpot} />

      {/* Featured strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { href: "/games/aviator", en: "Aviator", bn: "এভিয়েটর", emoji: "✈️" },
          { href: "/wingo", en: "WinGo", bn: "উইনগো", emoji: "🎯" },
          { href: "/games", en: "All Games", bn: "সব গেমস", emoji: "🎮" },
          { href: "/games/slots", en: "Slots", bn: "স্লট", emoji: "🎰" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-emerald-50 hover:bg-white/10"
          >
            {x.emoji} {t(x.en, x.bn)}
          </Link>
        ))}
      </div>

      <GameGrid />
    </div>
  );
}
