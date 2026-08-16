"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Headphones, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useState } from "react";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";

export function TopBar({
  onMenu,
  onSupport,
}: {
  onMenu?: () => void;
  onSupport?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const { t, lang, setLang } = useLang();
  const [hideBal, setHideBal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshBal() {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (json.ok && typeof json.data?.balance === "number") setBalance(json.data.balance);
    } catch {
      /* */
    }
    setRefreshing(false);
  }

  return (
    <header className="sticky top-0 z-40 pt-safe">
      <div className="border-b border-emerald-200/10 bg-[#061a14]/90 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[60px] max-w-lg items-center justify-between gap-1 px-2 py-2 sm:gap-1.5 sm:px-3 sm:py-2.5">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 active:opacity-90">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-[#eafff5] p-0.5 shadow-lg ring-2 ring-emerald-200/30">
              <Image src="/icons/logo.png" alt="TAKA69" fill className="rounded-[0.65rem] object-cover" priority />
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="text-[18px] font-black leading-none tracking-tight text-[#effff7] drop-shadow">TAKA69</div>
              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-100/55">Premium account</div>
            </div>
          </Link>

          <div className="topbar-utility flex min-w-0 items-center justify-end gap-1">
            {user ? (
              <div className="flex min-w-0 items-center gap-1 rounded-2xl border border-emerald-100/15 bg-emerald-100/[0.07] p-1 shadow-inner">
                <Link href="/profile" className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-emerald-100/70 bg-[#0a2b20] shadow">
                  <img src={user.avatar || DEFAULT_PROFILE_AVATAR} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 max-w-[66px] pr-0.5 sm:max-w-[150px]">
                  <div className="truncate text-[10px] font-bold leading-tight text-emerald-50">{user.username}</div>
                  <div className="flex items-center gap-0.5 text-[11px] font-black leading-tight tabular-nums text-mint-300">
                    <span className="text-[10px]">৳</span>
                    <span className="truncate">{hideBal ? "••••" : formatCoins(user.balance)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBal((v) => !v)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-100/70 transition hover:bg-emerald-100/10"
                  aria-label="Toggle balance"
                >
                  {hideBal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={refreshBal}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-100/70 transition hover:bg-emerald-100/10"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </button>
                <Link
                  href="/wallet?tab=deposit"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-emerald-400 text-[#063326] shadow-glow active:scale-95"
                  title={t("Deposit", "ডিপোজিট")}
                >
                  <span className="text-sm font-black">↓</span>
                </Link>
              </div>
            ) : (
              <div className="flex gap-1">
                <Link href="/login" className="flex min-h-11 items-center rounded-xl border border-emerald-100/20 bg-emerald-100/[0.07] px-2.5 py-1.5 text-xs font-bold text-emerald-50">
                  {t("Login", "লগইন")}
                </Link>
                <Link href="/register" className="flex min-h-11 items-center rounded-xl bg-gradient-to-r from-mint-300 to-emerald-400 px-2.5 py-1.5 text-xs font-bold text-[#063326] shadow-glow">
                  {t("Sign up", "নিবন্ধন")}
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100/20 bg-emerald-100/[0.07] px-1.5 text-[10px] font-bold text-emerald-50 sm:px-2"
              aria-label="Language"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            <NotificationBell />

            <button
              type="button"
              onClick={onSupport}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-100/75 transition hover:bg-emerald-100/10"
              aria-label="Support"
            >
              <Headphones className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onMenu}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-50 transition hover:bg-emerald-100/10 active:scale-95"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
