"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { QuickActions } from "@/components/home/QuickActions";
import { JackpotBar } from "@/components/home/JackpotBar";
import { GameGrid } from "@/components/home/GameGrid";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";
import { Download, ShieldCheck, Star } from "lucide-react";

export default function HomePage() {
  const t = useLang((s) => s.t);
  const [cfg, setCfg] = useState<{
    jackpot: number;
    banners?: unknown;
    apkUrl?: string | null;
    appVersion?: string;
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

      <section id="download" className="premium-card space-y-3 border-gold-500/25">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-amber-600 text-lg font-black text-emerald-950 shadow-gold">
            T69
          </div>
          <div>
            <div className="font-black text-white">TAKA69 App</div>
            <div className="flex items-center gap-1 text-xs text-gold-300">
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-gold-400 text-gold-400" />
                ))}
              </span>
              · Android · v{cfg?.appVersion || "1.0.0"}
            </div>
          </div>
        </div>
        <p className="text-sm text-emerald-100/80">
          {t(
            "Install the PWA or download the APK. Auto-updates with every web release.",
            "PWA ইনস্টল করুন বা APK ডাউনলোড করুন। প্রতিটি ওয়েব রিলিজে অটো-আপডেট।"
          )}
        </p>
        <div className="grid gap-2">
          {cfg?.apkUrl ? (
            <a href={cfg.apkUrl}>
              <Button variant="gold" className="w-full gap-2">
                <Download className="h-4 w-4" />
                {t("Download Android APK", "অ্যান্ড্রয়েড APK ডাউনলোড")}
              </Button>
            </a>
          ) : (
            <a href="/manifest.webmanifest">
              <Button variant="gold" className="w-full gap-2">
                <Download className="h-4 w-4" />
                {t("Add to Home Screen", "হোম স্ক্রিনে যোগ করুন")}
              </Button>
            </a>
          )}
          <Link href="/wallet">
            <Button variant="soft" className="w-full gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("Wallet · Deposit / Withdraw requests", "ওয়ালেট · ডিপোজিট / উইথড্র রিকোয়েস্ট")}
            </Button>
          </Link>
        </div>
        <p className="text-[10px] text-emerald-200/45">
          {t(
            "Virtual TC only. Deposit/withdraw are admin-reviewed play-money requests — not real cash rails.",
            "শুধু ভার্চুয়াল TC। ডিপোজিট/উইথড্র অ্যাডমিন-রিভিউড প্লে-মানি রিকোয়েস্ট — আসল ক্যাশ নয়।"
          )}
        </p>
      </section>
    </div>
  );
}
