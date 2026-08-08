"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

type Banner = {
  id: number;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  color: string;
};

const DEFAULT: Banner[] = [
  {
    id: 1,
    titleEn: "10,000 TC Free",
    titleBn: "১০,০০০ টিসি ফ্রি",
    subtitleEn: "Sign up bonus — play money only",
    subtitleBn: "সাইনআপ বোনাস — শুধু প্লে-মানি",
    color: "from-emerald-600 to-green-950",
  },
  {
    id: 2,
    titleEn: "Crash · Dice · Mines",
    titleBn: "ক্র্যাশ · ডাইস · মাইনস",
    subtitleEn: "Provably fair games",
    subtitleBn: "প্রুভেবলি ফেয়ার গেমস",
    color: "from-rose-700 to-red-950",
  },
  {
    id: 3,
    titleEn: "Daily 500 TC",
    titleBn: "দৈনিক ৫০০ টিসি",
    subtitleEn: "Claim from your wallet every day",
    subtitleBn: "প্রতিদিন ওয়ালেট থেকে নিন",
    color: "from-amber-600 to-orange-900",
  },
];

export function HeroCarousel({ banners }: { banners?: Banner[] | null }) {
  const list = banners?.length ? banners : DEFAULT;
  const [i, setI] = useState(0);
  const t = useLang((s) => s.t);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 4000);
    return () => clearInterval(id);
  }, [list.length]);

  const b = list[i];

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 min-h-[140px] border border-white/10 shadow-lg",
          b.color
        )}
      >
        <div className="absolute right-3 top-3 text-5xl opacity-30">🎁</div>
        <div className="relative z-10 max-w-[75%]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gold-300">
            TAKA69
          </div>
          <h2 className="mt-1 text-xl font-black text-white leading-tight">
            {t(b.titleEn, b.titleBn)}
          </h2>
          <p className="mt-1 text-sm text-white/80">{t(b.subtitleEn, b.subtitleBn)}</p>
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {list.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-5 bg-gold-400" : "w-1.5 bg-emerald-700"
            )}
          />
        ))}
      </div>
    </div>
  );
}
