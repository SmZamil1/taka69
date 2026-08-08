"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Wallet, Headphones } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function TopBar({
  onMenu,
  onSupport,
}: {
  onMenu?: () => void;
  onSupport?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const { t, lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-40 pt-safe">
      <div className="border-b border-white/[0.07] bg-[#070b0d]/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#070b0d]/55">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2.5">
          <Link href="/" className="flex items-center gap-2.5 active:opacity-80">
            <div className="relative h-10 w-10 overflow-hidden rounded-[0.9rem] shadow-gold ring-1 ring-white/15">
              <Image src="/icons/logo.png" alt="TAKA69" fill className="object-cover" priority />
            </div>
            <div>
              <div className="text-[17px] font-black leading-none tracking-tight gold-text">TAKA69</div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Premium
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            <NotificationBell />

            <button
              onClick={onSupport}
              className="rounded-full p-2 text-white/80 hover:bg-white/8 active:scale-95"
              aria-label="Support"
            >
              <Headphones className="h-4 w-4" />
            </button>

            {user ? (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-gradient-to-r from-white/10 to-white/5 px-2.5 py-1.5 text-sm font-bold text-amber-200 shadow-inner backdrop-blur active:scale-95"
              >
                <Wallet className="h-3.5 w-3.5" />
                {formatCoins(user.balance)}
                <span className="text-[10px] font-semibold text-white/45">TK</span>
              </Link>
            ) : (
              <div className="flex gap-1">
                <Link
                  href="/login"
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"
                >
                  {t("Login", "লগইন")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-gold"
                >
                  {t("Sign up", "নিবন্ধন")}
                </Link>
              </div>
            )}

            <button
              onClick={onMenu}
              className="rounded-full p-2 text-white/85 hover:bg-white/8 active:scale-95"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-hidden border-t border-white/[0.05] bg-black/20 px-3 py-1.5 text-[11px] text-white/55">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <div className="truncate">
            {t(
              "Play money only · Coins have zero cash value · 18+",
              "শুধু প্লে-মানি · কয়েনের নগদ মূল্য নেই · ১৮+"
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
