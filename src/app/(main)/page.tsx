"use client";

import { useEffect, useState } from "react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { JackpotBar } from "@/components/home/JackpotBar";
import { GameGrid } from "@/components/home/GameGrid";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export default function HomePage() {
  const t = useLang((s) => s.t);
  const [cfg, setCfg] = useState<{
    jackpot: number;
    banners?: unknown;
  } | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => j.ok && setCfg(j.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <HeroCarousel banners={(cfg?.banners as never) || null} />
      <QuickActions />
      <JackpotBar initial={cfg?.jackpot || 1_000_000} />
      <GameGrid />

      <section
        id="download"
        className="card space-y-3 border-gold-500/20 bg-gradient-to-br from-emerald-900/80 to-surface-950"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 text-lg font-black text-emerald-950">
            T69
          </div>
          <div>
            <div className="font-bold text-white">TAKA69 App</div>
            <div className="text-xs text-gold-300">★★★★★ · Android</div>
          </div>
        </div>
        <p className="text-sm text-emerald-100/80">
          {t(
            "Install the PWA or build the APK from this repo (Capacitor). Play-money only.",
            "PWA ইনস্টল করুন অথবা রিপো থেকে APK বানান (Capacitor)। শুধু প্লে-মানি।"
          )}
        </p>
        <a href="/manifest.webmanifest">
          <Button variant="gold" className="w-full gap-2">
            <Download className="h-4 w-4" />
            {t("Add to Home Screen / APK docs", "হোম স্ক্রিনে যোগ / APK ডক্স")}
          </Button>
        </a>
        <p className="text-[10px] text-emerald-200/50">
          {t(
            "* Cashback & bonuses are virtual TC only — not real money.",
            "* ক্যাশব্যাক ও বোনাস শুধু ভার্চুয়াল TC — আসল টাকা নয়।"
          )}
        </p>
      </section>
    </div>
  );
}
