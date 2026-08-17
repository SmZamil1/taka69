"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, ArrowDownToLine, WalletCards, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

const nav = [
  { href: "/", icon: Home, labelEn: "Home", labelBn: "হোম" },
  { href: "/promotions", icon: Gift, labelEn: "Promo", labelBn: "প্রমোশন" },
  { href: "/wallet?tab=deposit", icon: ArrowDownToLine, labelEn: "Deposit", labelBn: "জমা", center: true },
  { href: "/wallet", icon: WalletCards, labelEn: "Wallet", labelBn: "ওয়ালেট" },
  { href: "/profile", icon: UserRound, labelEn: "Member", labelBn: "সদস্য" },
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
    <nav className="reference-bottom-nav fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="reference-bottom-nav-shell mx-auto max-w-lg">
        <div className="relative flex items-end justify-between px-1 pt-1 pb-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const baseHref = n.href.split("?")[0];
              const active = baseHref === "/" ? path === "/" : path.startsWith(baseHref);
              if (n.center) {
                return (
                  <Link key={n.href} href={n.href} className="relative -mt-6 flex flex-1 flex-col items-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--page)] bg-gradient-to-br from-[#0ee48c] to-[#009864] text-[var(--ink-strong)] shadow-[0_8px_24px_rgba(14,228,140,0.42),inset_0_0_0_2px_rgba(242,184,75,0.85)] transition active:scale-95">
                      <Icon className="h-6 w-6" strokeWidth={2.4} />
                    </span>
                    <span className={cn("mt-0.5 text-[10px] font-bold", active ? "text-[var(--accent-strong)]" : "text-[var(--muted)]")}>
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
                    "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition",
                    active ? "reference-nav-active text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  )}
                >
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", active && "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]")}>
                    <Icon className={cn("h-5 w-5", active && "scale-110 drop-shadow-[0_0_8px_color-mix(in_srgb,var(--accent-strong)_45%,transparent)]")} />
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
