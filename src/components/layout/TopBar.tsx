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
    <header className="sticky top-0 z-40 border-b border-emerald-800/40 bg-[#07110b]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl shadow-gold ring-2 ring-gold-400/25">
            <Image src="/icons/logo.png" alt="TAKA69" fill className="object-cover" priority />
          </div>
          <div>
            <div className="text-lg font-black leading-none tracking-tight gold-text">TAKA69</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300/60">
              Premium
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="rounded-xl border border-emerald-700/50 bg-emerald-950/60 px-2 py-1 text-[10px] font-bold text-emerald-100"
          >
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          <NotificationBell />

          <button
            onClick={onSupport}
            className="rounded-xl p-2 text-emerald-100 hover:bg-white/5"
            aria-label="Support"
          >
            <Headphones className="h-4 w-4" />
          </button>

          {user ? (
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 rounded-full border border-gold-500/35 bg-gradient-to-r from-emerald-900 to-emerald-950 px-2.5 py-1.5 text-sm font-bold text-gold-300 shadow-inner"
            >
              <Wallet className="h-3.5 w-3.5" />
              {formatCoins(user.balance)}
            </Link>
          ) : (
            <div className="flex gap-1">
              <Link
                href="/login"
                className="rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white"
              >
                {t("Login", "লগইন")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-1.5 text-xs font-bold text-emerald-950"
              >
                {t("Sign up", "নিবন্ধন")}
              </Link>
            </div>
          )}

          <button
            onClick={onMenu}
            className="rounded-xl p-2 text-emerald-100 hover:bg-white/5"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-hidden border-t border-emerald-900/50 bg-emerald-950/40 px-3 py-1.5 text-xs text-emerald-100/90">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
        <div className="truncate">
          {t(
            "Play money only · Coins have zero cash value · 18+",
            "শুধু প্লে-মানি · কয়েনের নগদ মূল্য নেই · ১৮+"
          )}
        </div>
      </div>
    </header>
  );
}
