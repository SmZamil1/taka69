"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, Share2, Trophy, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

const nav = [
  { href: "/", icon: Home, labelEn: "Home", labelBn: "হোম" },
  { href: "/promotions", icon: Gift, labelEn: "Promo", labelBn: "প্রমোশন" },
  { href: "/referral", icon: Share2, labelEn: "Invite", labelBn: "আমন্ত্রণ", center: true },
  { href: "/rewards", icon: Trophy, labelEn: "Rewards", labelBn: "পুরস্কার" },
  { href: "/profile", icon: Crown, labelEn: "Member", labelBn: "সদস্য" },
];

export function BottomNav() {
  const path = usePathname();
  const lang = useLang((s) => s.lang);

  // Immersive game routes hide chrome in main layout — keep this as a safety net
  if (
    path.startsWith("/games/") ||
    path.startsWith("/wingo") ||
    path.startsWith("/game_aviator")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto max-w-lg border-t border-emerald-900/50 bg-[#0a3d2a]/97 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <div className="relative flex items-end justify-between px-1 pt-1 pb-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            if (n.center) {
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="relative -mt-6 flex flex-1 flex-col items-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow-[0_8px_24px_rgba(251,191,36,0.45)] ring-4 ring-[#0a3d2a] active:scale-95">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold text-amber-300">
                    {lang === "bn" ? n.labelBn : n.labelEn}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition",
                  active ? "text-amber-300" : "text-emerald-100/45 hover:text-emerald-100/80"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span>{lang === "bn" ? n.labelBn : n.labelEn}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
