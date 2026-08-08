"use client";

import Link from "next/link";
import { Menu, Wallet, Bell } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { t, lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-800/50 bg-surface-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 text-xs font-black text-emerald-950 shadow-gold">
            T69
          </div>
          <span className="text-xl font-black tracking-tight text-gold-400 drop-shadow">
            TAKA69
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="rounded-lg border border-emerald-700/50 px-2 py-1 text-[10px] font-bold text-emerald-100"
            aria-label="Language"
          >
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          {user ? (
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 rounded-full bg-emerald-900/80 px-2.5 py-1.5 text-sm font-semibold text-gold-300 border border-gold-500/30"
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
                className="rounded-full bg-gold-500 px-3 py-1.5 text-xs font-bold text-emerald-950"
              >
                {t("Sign up", "নিবন্ধন")}
              </Link>
            </div>
          )}

          <button
            onClick={onMenu}
            className="rounded-lg p-2 text-emerald-100 hover:bg-white/5"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-hidden border-t border-emerald-900/60 bg-emerald-950/50 px-3 py-1.5 text-xs text-emerald-100/90">
        <Bell className="h-3.5 w-3.5 shrink-0 text-gold-400" />
        <div className="animate-pulse truncate">
          {t(
            "Play money only · Coins have zero cash value · 18+",
            "শুধু প্লে-মানি · কয়েনের নগদ মূল্য নেই · ১৮+"
          )}
        </div>
      </div>
    </header>
  );
}
