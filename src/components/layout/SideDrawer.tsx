"use client";

import Link from "next/link";
import {
  X,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  LogOut,
  Target,
  Gamepad2,
  Shield,
  Crown,
  Gift,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useRouter } from "next/navigation";
import { formatCoins } from "@/lib/utils";

export function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const router = useRouter();

  if (!open) return null;

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (json.ok) {
        if (json.data) setUser(json.data);
        if (typeof json.data?.balance === "number") setBalance(json.data.balance);
      }
    } catch {
      /* */
    }
  }

  const items = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "ডিপোজিট" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন করুন" },
    { href: "#refresh", icon: RefreshCw, en: "Refresh balance", bn: "ব্যালেন্স রিফ্রেশ", action: "refresh" },
    { href: "/wallet", icon: Wallet, en: "Wallet", bn: "ওয়ালেট" },
    { href: "/games", icon: Gamepad2, en: "All Games", bn: "সব গেমস" },
    { href: "/wingo", icon: Gift, en: "WinGo", bn: "উইনগো" },
    { href: "/rewards", icon: Target, en: "Missions", bn: "মিশন" },
    { href: "/rebate", icon: Gift, en: "Rebate", bn: "রিবেট" },
    { href: "/vip", icon: Crown, en: "VIP", bn: "ভিআইপি" },
    { href: "/security", icon: Shield, en: "Security center", bn: "সুরক্ষা কেন্দ্র" },
    { href: "/claim-center", icon: Gift, en: "Claim center", bn: "দাবি কেন্দ্র" },
    { href: "/referral", icon: Gift, en: "Invite friends", bn: "বন্ধুদের আমন্ত্রণ" },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-[#020b08]/75 backdrop-blur-md"
        style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
        onClick={onClose}
      />
      <aside className="absolute right-2 top-[calc(3.75rem+env(safe-area-inset-top))] flex max-h-[calc(100dvh-5rem-env(safe-area-inset-top))] w-[min(88vw,300px)] flex-col overflow-hidden rounded-[1.5rem] border border-emerald-200/15 bg-gradient-to-b from-[#0d3025] to-[#061711] shadow-[0_24px_80px_rgba(0,0,0,0.7)] sm:right-3">
        <div className="flex min-h-16 items-center justify-between border-b border-emerald-100/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-emerald-50">{user?.username || "TAKA69"}</div>
            {user && <div className="text-xs font-bold text-gold-300">৳ {formatCoins(user.balance)}</div>}
          </div>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-100/80 hover:bg-emerald-100/10" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto py-1">
          {items.map((i) => {
            const Icon = i.icon;
            if (i.action === "refresh") {
              return (
                <button
                  key={i.en}
                  type="button"
                  onClick={async () => {
                    await refresh();
                    onClose();
                  }}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-semibold text-emerald-50 transition hover:bg-emerald-400/10"
                >
                  <Icon className="h-5 w-5 text-mint-300" />
                  {t(i.en, i.bn)}
                </button>
              );
            }
            return (
              <Link
                key={i.href + i.en}
                href={i.href}
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 px-4 py-3 text-[14px] font-semibold text-emerald-50 transition hover:bg-emerald-400/10"
              >
                <Icon className="h-5 w-5 text-mint-300" />
                {t(i.en, i.bn)}
              </Link>
            );
          })}

          {user && (user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "SUPPORT") && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex min-h-14 items-center gap-3 border-t border-emerald-100/10 px-4 py-3 text-[14px] font-bold text-gold-300 transition hover:bg-gold-400/10"
            >
              <Shield className="h-5 w-5" />
              {t("Admin Panel", "অ্যাডমিন প্যানেল")}
            </Link>
          )}

          {user ? (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                setUser(null);
                onClose();
                router.push("/login");
              }}
              className="flex min-h-14 w-full items-center gap-3 border-t border-emerald-100/10 px-4 py-3 text-left text-[14px] font-semibold text-emerald-100/75 transition hover:bg-[#04110e]"
            >
              <LogOut className="h-5 w-5" />
              {t("Logout", "লগ আউট")}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="m-3 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-gold-300 to-gold-500 py-3 text-center text-sm font-black text-[#18200e] shadow-gold"
            >
              {t("Login", "লগইন")}
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
