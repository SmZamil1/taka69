"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Banner = {
  id: number;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  color?: string;
  image?: string;
  href?: string;
  ctaEn?: string;
  ctaBn?: string;
};

const DEFAULT: Banner[] = [
  {
    id: 1,
    titleEn: "First Deposit Bonus",
    titleBn: "প্রথম জমার বোনাস",
    subtitleEn: "Up to ৳18,888 bonus on your first top-up!",
    subtitleBn: "সর্বোচ্চ ৳১৮,৮৮৮ পর্যন্ত প্রথম জমা বোনাস!",
    color: "from-[#173f73] via-[#102b57] to-[#071426]",
    href: "/wallet?tab=deposit",
    ctaEn: "Deposit now →",
    ctaBn: "এখনই জমা দিন →",
    image: "/banners/welcome.jpg",
  },
  {
    id: 2,
    titleEn: "Aviator Live",
    titleBn: "এভিয়েটর লাইভ",
    subtitleEn: "Cash out before the plane flies — up to 100x!",
    subtitleBn: "প্লেন উড়ে যাওয়ার আগে ক্যাশআউট — ১০০x পর্যন্ত!",
    color: "from-[#2f80c5] via-[#173f73] to-[#071426]",
    href: "/games/aviator",
    ctaEn: "Play Aviator →",
    ctaBn: "এভিয়েটর খেলুন →",
  },
  {
    id: 3,
    titleEn: "WinGo 1 Minute",
    titleBn: "উইনগো ১ মিনিট",
    subtitleEn: "Predict color & number — win up to 9x every minute",
    subtitleBn: "রঙ ও নম্বর প্রেডিক্ট করুন — প্রতি মিনিটে ৯x পর্যন্ত",
    color: "from-[#b86f12] via-[#7a4b12] to-[#102b57]",
    href: "/wingo",
    ctaEn: "Play WinGo →",
    ctaBn: "উইনগো খেলুন →",
  },
  {
    id: 4,
    titleEn: "Invite & Earn",
    titleBn: "আমন্ত্রণ ও আয়",
    subtitleEn: "3-level referral commission on every bet",
    subtitleBn: "প্রতিটি বেটে ৩-লেভেল রেফারেল কমিশন",
    color: "from-[#1f609e] via-[#173f73] to-[#071426]",
    href: "/referral",
    ctaEn: "Invite friends →",
    ctaBn: "বন্ধুদের আমন্ত্রণ →",
  },
];

export function HeroCarousel({ banners }: { banners?: Banner[] | null }) {
  const list = banners?.length ? banners : DEFAULT;
  const [i, setI] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const t = useLang((s) => s.t);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 4200);
    return () => clearInterval(id);
  }, [list.length]);

  useEffect(() => setImgOk(true), [i]);

  const b = list[i];
  const img = (b as Banner).image;
  const href = (b as Banner).href || "/wallet?tab=deposit";

  return (
    <div className="space-y-2">
      <Link
        href={href}
        className={cn(
          "relative block overflow-hidden rounded-2xl min-h-[148px] border border-gold-400/30 shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
          (!img || !imgOk) && "bg-gradient-to-br",
          (!img || !imgOk) && (b.color || "from-[#173f73] via-[#102b57] to-[#071426]")
        )}
      >
        {img && imgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        {/* decorative wallet badge */}
        <div className="absolute right-3 top-3 rounded-lg bg-black/40 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-gold-300 border border-gold-400/30">
          DEPOSIT BONUS
        </div>
        <div className="relative z-10 p-4 max-w-[78%]">
          <div className="inline-flex items-center gap-1 rounded-md bg-gold-400/15 border border-gold-400/30 px-2 py-0.5 text-[9px] font-bold text-gold-300">
            Simi69 · ৳18,888
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-white drop-shadow-lg">
            {t(b.titleEn, b.titleBn)}
          </h2>
          <p className="mt-1 text-[12px] leading-snug text-blue-50/85 line-clamp-2">
            {t(b.subtitleEn, b.subtitleBn)}
          </p>
          {(b.ctaEn || b.ctaBn) && (
            <span className="mt-3 inline-flex rounded-full bg-gradient-to-r from-gold-300 to-gold-400 px-3 py-1 text-[11px] font-black text-[#102b57] shadow">
              {t(b.ctaEn || "Open", b.ctaBn || "খুলুন")}
            </span>
          )}
        </div>
      </Link>

      <div className="flex justify-center gap-1.5">
        {list.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setI(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-5 bg-gold-400" : "w-1.5 bg-white/25"
            )}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
