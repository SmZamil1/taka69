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
      <div className="border-b border-[#294f83] bg-[#102b57] shadow-[0_5px_20px_rgba(16,43,87,0.28)]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-1 px-2 py-2 sm:gap-1.5 sm:px-3 sm:py-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-2 active:opacity-90">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white p-0.5 shadow-lg ring-2 ring-blue-100/70">
              <Image src="/icons/logo.png" alt="TAKA69" fill className="rounded-[0.65rem] object-cover" priority />
            </div>
            <div className="hidden sm:block">
              <div className="text-[18px] font-black leading-none tracking-tight text-white drop-shadow">TAKA69</div>
              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-blue-100/70">Premium account</div>
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {user ? (
              <div className="flex min-w-0 items-center gap-1 rounded-2xl border border-white/20 bg-white/10 p-1 shadow-inner">
                <Link href="/profile" className="h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow">
                  <img src={user.avatar || DEFAULT_PROFILE_AVATAR} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 max-w-[72px] pr-0.5 sm:max-w-[150px]">
                  <div className="truncate text-[10px] font-bold leading-tight text-white">{user.username}</div>
                  <div className="flex items-center gap-0.5 text-[11px] font-black leading-tight tabular-nums text-blue-100">
                    <span className="text-[10px]">৳</span>
                    <span className="truncate">{hideBal ? "••••" : formatCoins(user.balance)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBal((v) => !v)}
                  className="shrink-0 rounded-lg p-1 text-blue-100/80 transition hover:bg-white/15"
                  aria-label="Toggle balance"
                >
                  {hideBal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={refreshBal}
                  className="shrink-0 rounded-lg p-1 text-blue-100/80 transition hover:bg-white/15"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </button>
                <Link
                  href="/wallet?tab=deposit"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-[#102b57] shadow active:scale-95"
                  title={t("Deposit", "ডিপোজিট")}
                >
                  <span className="text-sm font-black">↓</span>
                </Link>
              </div>
            ) : (
              <div className="flex gap-1">
                <Link href="/login" className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white">
                  {t("Login", "লগইন")}
                </Link>
                <Link href="/register" className="rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-[#102b57]">
                  {t("Sign up", "নিবন্ধন")}
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-1.5 py-1.5 text-[10px] font-bold text-white sm:px-2"
              aria-label="Language"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            <NotificationBell />

            <button
              type="button"
              onClick={onSupport}
              className="shrink-0 rounded-xl p-1.5 text-blue-100 transition hover:bg-white/10"
              aria-label="Support"
            >
              <Headphones className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onMenu}
              className="shrink-0 rounded-xl p-1.5 text-white transition hover:bg-white/10 active:scale-95"
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
