"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

type Banner = {
  id: number;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  color?: string;
  image?: string;
};

const DEFAULT: Banner[] = [
  {
    id: 1,
    titleEn: "10,000 TC Free",
    titleBn: "১০,০০০ টিসি ফ্রি",
    subtitleEn: "Welcome bonus · play money only",
    subtitleBn: "স্বাগতম বোনাস · শুধু প্লে-মানি",
    image: "/banners/welcome.jpg",
    color: "from-emerald-700 to-green-950",
  },
  {
    id: 2,
    titleEn: "Crash · Plinko · Slots",
    titleBn: "ক্র্যাশ · প্লিঙ্কো · স্লট",
    subtitleEn: "Premium provably fair games",
    subtitleBn: "প্রিমিয়াম প্রুভেবলি ফেয়ার গেমস",
    color: "from-rose-700 to-red-950",
  },
  {
    id: 3,
    titleEn: "Daily 500 TC",
    titleBn: "দৈনিক ৫০০ টিসি",
    subtitleEn: "Claim from Wallet every day",
    subtitleBn: "প্রতিদিন ওয়ালেট থেকে নিন",
    color: "from-amber-600 to-orange-900",
  },
];

export function HeroCarousel({ banners }: { banners?: Banner[] | null }) {
  const list = banners?.length ? banners : DEFAULT;
  const [i, setI] = useState(0);
  const t = useLang((s) => s.t);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % list.length), 4500);
    return () => clearInterval(id);
  }, [list.length]);

  const b = list[i];
  const img = b.image || (i === 0 ? "/banners/welcome.jpg" : undefined);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl min-h-[160px] border border-white/10 shadow-2xl",
          !img && "bg-gradient-to-br",
          !img && (b.color || "from-emerald-700 to-green-950")
        )}
      >
        {img && (
          <Image src={img} alt="" fill className="object-cover" priority sizes="500px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        <div className="relative z-10 p-5 max-w-[78%]">
          <div className="inline-flex items-center gap-1 rounded-full border border-gold-400/30 bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold-300 backdrop-blur">
            TAKA69 PREMIUM
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white drop-shadow-lg">
            {t(b.titleEn, b.titleBn)}
          </h2>
          <p className="mt-1 text-sm text-white/85">{t(b.subtitleEn, b.subtitleBn)}</p>
        </div>
        <div className="pointer-events-none absolute inset-0 shimmer" />
      </div>
      <div className="flex justify-center gap-1.5">
        {list.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i ? "w-6 bg-gold-400" : "w-1.5 bg-emerald-700"
            )}
          />
        ))}
      </div>
    </div>
  );
}
