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

  if (
    path.startsWith("/games/") ||
    path.startsWith("/wingo") ||
    path.startsWith("/game_aviator")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg border-t border-emerald-100/10 bg-[#071b15]/90 shadow-[0_-12px_34px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
        <div className="relative flex min-h-[68px] items-end justify-between px-1 pt-1 pb-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            if (n.center) {
              return (
                <Link key={n.href} href={n.href} className="relative -mt-6 flex min-h-16 flex-1 flex-col items-center justify-end">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-mint-300 to-emerald-500 text-[#063326] shadow-[0_8px_24px_rgba(34,197,139,0.3)] ring-4 ring-[#071b15] active:scale-95">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold text-mint-300">{lang === "bn" ? n.labelBn : n.labelEn}</span>
                </Link>
              );
            }
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex min-h-16 flex-1 flex-col items-center justify-end gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition",
                  active ? "text-mint-300" : "text-emerald-100/50 hover:text-emerald-100/80"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", active && "bg-emerald-400/15 shadow-[0_0_18px_rgba(34,197,139,0.16)]")}>
                  <Icon className={cn("h-5 w-5", active && "scale-110")} />
                </span>
                <span>{lang === "bn" ? n.labelBn : n.labelEn}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
