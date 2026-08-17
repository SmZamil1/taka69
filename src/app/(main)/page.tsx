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
  const [currency, setCurrency] = useState("TK");
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
          if (j.data.currency) setCurrency(String(j.data.currency));
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
    <div className="-mx-3 -mt-3 min-h-[calc(100dvh-5rem)] space-y-3 bg-[var(--page)] px-3 pb-24 pt-3 text-[var(--ink)]">
      {/* Marquee notice bar */}
      <div className="flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_42%,var(--line))] bg-[color-mix(in_srgb,var(--header)_92%,var(--surface))] px-3 py-2 shadow-[0_7px_18px_rgba(0,0,0,0.22)]">
        <Bell className="h-4 w-4 shrink-0 text-[#ffe3a3]" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-[12px] font-semibold text-[color-mix(in_srgb,var(--ink)_82%,var(--accent-strong))]">
            {marquee} · {t("First deposit bonus up to ৳18,888", "প্রথম জমা বোনাস সর্বোচ্চ ৳১৮,৮৮৮")}
          </div>
        </div>
        <Link
          href="/promotions"
          className="relative shrink-0 rounded-full bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] p-1.5 text-[var(--gold-bright)]"
          aria-label="Inbox"
        >
          <Mail className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
        </Link>
      </div>

      <HeroCarousel banners={banners} />
      <QuickActions />
      <JackpotBar jackpot={jackpot} currency={currency} />

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
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 text-[11px] font-bold text-[var(--ink)] shadow-[0_4px_12px_rgba(0,0,0,0.16)] transition hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-raised))]"
          >
            {x.kind === "img" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.img} alt="" className="h-4 w-4 object-contain" />
            ) : (
              <x.Icon className="h-3.5 w-3.5 text-[var(--gold-bright)]" />
            )}
            {t(x.en, x.bn)}
          </Link>
        ))}
      </div>

      <GameGrid />
    </div>
  );
}
