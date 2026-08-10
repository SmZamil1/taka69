"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Banner = {
  id: number; titleEn: string; titleBn: string;
  subtitleEn: string; subtitleBn: string;
  color?: string; image?: string; href?: string;
  ctaEn?: string; ctaBn?: string;
};

const DEFAULT: Banner[] = [
  {
    id: 1, titleEn: "WinGo Color Prediction", titleBn: "উইনগো কালার প্রেডিকশন",
    subtitleEn: "Predict the color & win up to 9x — rounds every 1 min!",
    subtitleBn: "রঙ প্রেডিক্ট করুন ও ৯x পর্যন্ত জিতুন — প্রতি ১ মিনিটে রাউন্ড!",
    color: "from-amber-600 to-orange-900", href: "/wingo",
    ctaEn: "Play WinGo →", ctaBn: "উইনগো খেলুন →",
  },
  {
    id: 2, titleEn: "Aviator Crash Game", titleBn: "এভিয়েটর ক্র্যাশ গেম",
    subtitleEn: "Cash out before the plane flies away — up to 100x!",
    subtitleBn: "প্লেন উড়ে যাওয়ার আগেই ক্যাশআউট করুন — ১০০x পর্যন্ত!",
    color: "from-rose-700 to-red-950", href: "/games/crash",
    ctaEn: "Play Aviator →", ctaBn: "এভিয়েটর খেলুন →",
  },
  {
    id: 3, titleEn: "VIP Program", titleBn: "ভিআইপি প্রোগ্রাম",
    subtitleEn: "Bronze → Legend. Daily bonuses, cashback & more rewards!",
    subtitleBn: "ব্রোঞ্জ → লিজেন্ড। ডেইলি বোনাস, ক্যাশব্যাক ও আরও পুরস্কার!",
    color: "from-purple-700 to-violet-950", href: "/vip",
    ctaEn: "View VIP →", ctaBn: "ভিআইপি দেখুন →",
  },
  {
    id: 4, titleEn: "3-Level Referral", titleBn: "৩-লেভেল রেফারেল",
    subtitleEn: "Earn up to 3% commission from every bet your team makes!",
    subtitleBn: "আপনার টিমের প্রতিটি বেট থেকে ৩% পর্যন্ত কমিশন আয় করুন!",
    color: "from-emerald-700 to-teal-950", href: "/referral",
    ctaEn: "Invite Friends →", ctaBn: "বন্ধুদের আমন্ত্রণ দিন →",
  },
];

export function HeroCarousel({ banners }: { banners?: Banner[] | null }) {
  const list = banners?.length ? banners : DEFAULT;
  const [i, setI] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const t = useLang((s) => s.t);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 4000);
    return () => clearInterval(id);
  }, [list.length]);

  useEffect(() => setImgOk(true), [i]);

  const b = list[i];
  const img = (b as Banner).image;
  const href = (b as Banner).href;
  const ctaEn = (b as Banner).ctaEn;
  const ctaBn = (b as Banner).ctaBn;

  return (
    <div className="space-y-2">
      <div className={cn(
        "relative overflow-hidden rounded-2xl min-h-[168px] border border-white/10 shadow-2xl",
        (!img || !imgOk) && "bg-gradient-to-br",
        (!img || !imgOk) && (b.color || "from-emerald-700 to-green-950")
      )}>
        {img && imgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setImgOk(false)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="relative z-10 p-5 max-w-[80%]">
          <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300 backdrop-blur">
            TAKA69 PREMIUM
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white drop-shadow-lg">
            {t(b.titleEn, b.titleBn)}
          </h2>
          <p className="mt-1 text-sm text-white/80">{t(b.subtitleEn, b.subtitleBn)}</p>
          {href && ctaEn && (
            <Link href={href}
              className="mt-3 inline-flex items-center rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-emerald-950 hover:bg-amber-300 transition">
              {t(ctaEn, ctaBn || ctaEn)}
            </Link>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 shimmer" />
      </div>
      <div className="flex justify-center gap-1.5">
        {list.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)}
            className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-6 bg-amber-400" : "w-1.5 bg-emerald-700")} />
        ))}
      </div>
    </div>
  );
}
