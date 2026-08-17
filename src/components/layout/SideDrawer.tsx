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
  Headphones,
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
      {/* Navy drawer with icy-blue accents and gold actions */}
      <div
        className="absolute inset-0 bg-[#071426]/70 backdrop-blur-md"
        style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
        onClick={onClose}
      />
      <aside className="absolute right-3 top-16 w-[min(86vw,280px)] overflow-hidden rounded-2xl border border-[#7dc4ee]/35 bg-[#102b57] shadow-[0_20px_60px_rgba(3,18,45,0.62)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-black text-white">{user?.username || "TAKA69"}</div>
            {user && (
              <div className="text-xs font-bold text-amber-300">৳ {formatCoins(user.balance)}</div>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10">
            <X className="h-4 w-4 text-white/80" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto py-1">
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
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[14px] font-semibold text-blue-50 hover:bg-[#1d477d]"
                >
                  <Icon className="h-5 w-5 text-[#9fdbf5]" />
                  {t(i.en, i.bn)}
                </button>
              );
            }
            return (
              <Link
                key={i.href + i.en}
                href={i.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold text-blue-50 hover:bg-[#1d477d]"
              >
                <Icon className="h-5 w-5 text-[#9fdbf5]" />
                {t(i.en, i.bn)}
              </Link>
            );
          })}

          {user && (user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "SUPPORT") && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 border-t border-white/10 px-4 py-3.5 text-[14px] font-bold text-amber-200 hover:bg-amber-400/15"
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
              className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3.5 text-left text-[14px] font-semibold text-blue-100 hover:bg-[#0b2144]"
            >
              <LogOut className="h-5 w-5" />
              {t("Logout", "লগ আউট")}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="m-3 block rounded-xl bg-amber-400 py-3 text-center text-sm font-black text-[#102b57] shadow-[0_6px_16px_rgba(245,183,52,0.22)]"
            >
              {t("Login", "লগইন")}
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
