"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Gift, Share2, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";
import { Suspense } from "react";

const items = [
  { href: "/", icon: Home, en: "Home", bn: "হোম" },
  { href: "/promotions", icon: Gift, en: "Promo", bn: "প্রমো" },
  { href: "/rewards", icon: Share2, en: "Invite", bn: "আমন্ত্রণ", center: true },
  { href: "/rewards?tab=leaderboard", icon: Trophy, en: "Ranks", bn: "র‍্যাঙ্ক", tab: "leaderboard" },
  { href: "/profile", icon: User, en: "Me", bn: "সদস্য" },
];

function NavInner() {
  const path = usePathname();
  const params = useSearchParams();
  const t = useLang((s) => s.t);
  const tab = params.get("tab");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none">
      <div className="mx-auto max-w-lg px-3 pb-2 pt-1 pointer-events-auto">
        <div className="flex items-end justify-around rounded-[1.6rem] border border-white/10 bg-[#0b1014]/78 px-1 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {items.map((item) => {
            const base = item.href.split("?")[0];
            let active = false;
            if (item.tab) {
              active = path.startsWith("/rewards") && tab === item.tab;
            } else if (item.center) {
              active = path.startsWith("/rewards") && tab !== "leaderboard";
            } else if (base === "/") {
              active = path === "/";
            } else {
              active = path === base || path.startsWith(base + "/");
            }
            const Icon = item.icon;
            if (item.center) {
              return (
                <Link key={item.href} href={item.href} className="-mt-6 flex flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-emerald-950 shadow-[0_8px_24px_rgba(251,191,36,0.45)] ring-4 ring-[#05080a] active:scale-95 transition">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold text-amber-300/90">
                    {t(item.en, item.bn)}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[56px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition active:scale-95",
                  active ? "text-amber-300 bg-white/5" : "text-white/45"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]")} />
                {t(item.en, item.bn)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
