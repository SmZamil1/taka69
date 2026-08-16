"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { JackpotBar } from "@/components/home/JackpotBar";
import { GameGrid } from "@/components/home/GameGrid";
import { useLang } from "@/hooks/useLang";
import { Bell, Gamepad2, Mail, Plane, Target } from "lucide-react";

export default function HomePage() {
  const t = useLang((s) => s.t);
  const [banners, setBanners] = useState(null);
  const [jackpot, setJackpot] = useState<number | null>(null);
  const [marquee, setMarquee] = useState(
    "৳7,777 · প্রথম জমা বোনাস সর্বোচ্চ ৳১৮,৮৮৮ · প্রতি শুক্রবার সুপার বোনাস"
  );

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
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
      {/* Marquee notice bar */}
      <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-gradient-to-r from-emerald-950 to-emerald-900 px-3 py-2 shadow-inner">
        <Bell className="h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-[12px] font-semibold text-amber-100/90">
            {marquee} · {t("First deposit bonus up to ৳18,888", "প্রথম জমা বোনাস সর্বোচ্চ ৳১৮,৮৮৮")}
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

      {/* Featured strip — icons only, no emoji */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {([
          { href: "/games/aviator", en: "Aviator", bn: "এভিয়েটর", kind: "icon" as const, Icon: Plane },
          { href: "/wingo", en: "WinGo", bn: "উইনগো", kind: "icon" as const, Icon: Target },
          { href: "/games", en: "All Games", bn: "সব গেমস", kind: "icon" as const, Icon: Gamepad2 },
          { href: "/games/slots", en: "Slots", bn: "স্লট", kind: "img" as const, img: "/icons/cat-slots.png" },
        ]).map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-emerald-50 hover:bg-white/10"
          >
            {x.kind === "img" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.img} alt="" className="h-4 w-4 object-contain" />
            ) : (
              <x.Icon className="h-3.5 w-3.5 text-amber-300" />
            )}
            {t(x.en, x.bn)}
          </Link>
        ))}
      </div>

      <GameGrid />
    </div>
  );
}
