"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Wallet, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

const nav = [
  { href: "/",        icon: Home,      labelEn: "Home",    labelBn: "হোম" },
  { href: "/wingo",   icon: Zap,       labelEn: "WinGo",   labelBn: "উইনগো" },
  { href: "/games",   icon: Gamepad2,  labelEn: "Games",   labelBn: "গেমস" },
  { href: "/wallet",  icon: Wallet,    labelEn: "Wallet",  labelBn: "ওয়ালেট" },
  { href: "/profile", icon: User,      labelEn: "Me",      labelBn: "আমি" },
];

export function BottomNav() {
  const path = usePathname();
  const lang = useLang((s) => s.lang);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition",
                active ? "text-amber-400" : "text-white/40 hover:text-white/70"
              )}
            >
              <Icon className={cn("h-5 w-5 transition", active && "scale-110")} />
              <span>{lang === "bn" ? n.labelBn : n.labelEn}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
