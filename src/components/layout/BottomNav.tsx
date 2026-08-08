"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, Share2, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

const items = [
  { href: "/", icon: Home, en: "Home", bn: "হোম" },
  { href: "/promotions", icon: Gift, en: "Promo", bn: "প্রমোশন" },
  { href: "/rewards", icon: Share2, en: "Invite", bn: "আমন্ত্রণ", center: true },
  { href: "/rewards?tab=leaderboard", icon: Trophy, en: "Ranks", bn: "পুরস্কার" },
  { href: "/profile", icon: User, en: "Me", bn: "সদস্য" },
];

export function BottomNav() {
  const path = usePathname();
  const t = useLang((s) => s.t);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-800/60 bg-surface-950/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex max-w-lg items-end justify-around px-1 pt-1 pb-2">
        {items.map((item) => {
          const active = path === item.href || (item.href !== "/" && path.startsWith(item.href.split("?")[0]));
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-5 flex flex-col items-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-amber-600 text-emerald-950 shadow-gold ring-4 ring-surface-950">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-gold-300">
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
                "flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                active ? "text-gold-400" : "text-emerald-200/60"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow")} />
              {t(item.en, item.bn)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
