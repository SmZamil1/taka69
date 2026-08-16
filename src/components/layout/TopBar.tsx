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
      <div className="border-b border-emerald-900/60 bg-[#0a3d2a] shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-1.5 px-2.5 py-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 active:opacity-90">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-2 ring-amber-400/40 shadow-lg">
              <Image src="/icons/logo.png" alt="TAKA69" fill className="object-cover" priority />
            </div>
            <div className="hidden xs:block sm:block">
              <div className="text-[18px] font-black leading-none tracking-tight bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow">
                TAKA69
              </div>
              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-200/50">
                Premium
              </div>
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            {user ? (
              <div className="flex min-w-0 items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-950/50 pl-1 pr-1 py-1">
                <Link href="/profile" className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-amber-200/70 bg-amber-300 shadow">
                  <img src={user.avatar || DEFAULT_PROFILE_AVATAR} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 max-w-[120px] sm:max-w-[160px] pr-0.5">
                  <div className="truncate text-[10px] font-bold text-white leading-tight">
                    {user.username}
                  </div>
                  <div className="flex items-center gap-0.5 text-[11px] font-black text-amber-300 tabular-nums leading-tight">
                    <span className="text-[10px]">৳</span>
                    <span className="truncate">{hideBal ? "••••" : formatCoins(user.balance)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBal((v) => !v)}
                  className="shrink-0 rounded-full p-1 text-emerald-200/70 hover:bg-white/10"
                  aria-label="Toggle balance"
                >
                  {hideBal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={refreshBal}
                  className="shrink-0 rounded-full p-1 text-emerald-200/70 hover:bg-white/10"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </button>
                <Link
                  href="/wallet?tab=deposit"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow active:scale-95"
                  title={t("Deposit", "ডিপোজিট")}
                >
                  <span className="text-sm font-black">↓</span>
                </Link>
              </div>
            ) : (
              <div className="flex gap-1">
                <Link
                  href="/login"
                  className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white"
                >
                  {t("Login", "লগইন")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2.5 py-1.5 text-xs font-bold text-emerald-950"
                >
                  {t("Sign up", "নিবন্ধন")}
                </Link>
              </div>
            )}

            {/* Language always visible */}
            <button
              type="button"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold text-white/90"
              aria-label="Language"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            <NotificationBell />

            <button
              type="button"
              onClick={onSupport}
              className="shrink-0 rounded-full p-1.5 text-emerald-100/90 hover:bg-white/10"
              aria-label="Support"
            >
              <Headphones className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onMenu}
              className="shrink-0 rounded-full p-1.5 text-white hover:bg-white/10 active:scale-95"
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
