"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Headphones, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useState } from "react";

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
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2.5">
          <Link href="/" className="flex items-center gap-2 active:opacity-90">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-2 ring-amber-400/40 shadow-lg">
              <Image src="/icons/logo.png" alt="TAKA69" fill className="object-cover" priority />
            </div>
            <div>
              <div className="text-[20px] font-black leading-none tracking-tight bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow">
                TAKA69
              </div>
              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.22em] text-emerald-200/50">
                Premium
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {user ? (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-950/50 pl-1 pr-1.5 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-600 text-xs font-black text-emerald-950">
                  {user.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 pr-1">
                  <div className="max-w-[72px] truncate text-[11px] font-bold text-white leading-tight">
                    {user.username}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 tabular-nums">
                    <span className="text-[10px]">৳</span>
                    {hideBal ? "••••" : formatCoins(user.balance)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHideBal((v) => !v)}
                  className="rounded-full p-1 text-emerald-200/70 hover:bg-white/10"
                  aria-label="Toggle balance"
                >
                  {hideBal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={refreshBal}
                  className="rounded-full p-1 text-emerald-200/70 hover:bg-white/10"
                  aria-label="Refresh"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                </button>
                <Link
                  href="/wallet?tab=deposit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow active:scale-95"
                  title={t("Deposit", "ডিপোজিট")}
                >
                  <span className="text-sm font-black">↓</span>
                </Link>
              </div>
            ) : (
              <div className="flex gap-1">
                <Link
                  href="/login"
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"
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

            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-[10px] font-black">
              🇧🇩
            </div>

            <NotificationBell />

            <button
              onClick={onSupport}
              className="rounded-full p-1.5 text-emerald-100/90 hover:bg-white/10"
              aria-label="Support"
            >
              <Headphones className="h-4 w-4" />
            </button>

            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="hidden rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold text-white/90 sm:inline"
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>

            <button
              onClick={onMenu}
              className="rounded-full p-1.5 text-white hover:bg-white/10 active:scale-95"
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
