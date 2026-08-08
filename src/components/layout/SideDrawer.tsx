"use client";

import Link from "next/link";
import { X, Gamepad2, Shield, Download, LogOut, Wallet, Target, Headphones } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useRouter } from "next/navigation";

export function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const t = useLang((s) => s.t);
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-[82%] max-w-xs bg-[#0b1710] border-l border-emerald-800 shadow-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-black gold-text">TAKA69</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {[
          { href: "/", icon: Gamepad2, en: "Games", bn: "গেমস" },
          { href: "/wallet", icon: Wallet, en: "Wallet", bn: "ওয়ালেট" },
          { href: "/wallet?tab=deposit", icon: Wallet, en: "Deposit", bn: "ডিপোজিট" },
          { href: "/wallet?tab=withdraw", icon: Wallet, en: "Withdraw", bn: "উত্তোলন" },
          { href: "/rewards", icon: Target, en: "Missions", bn: "মিশন" },
          { href: "/#download", icon: Download, en: "Android APK", bn: "অ্যান্ড্রয়েড APK" },
        ].map((i) => (
          <Link
            key={i.href + i.en}
            href={i.href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-emerald-50 hover:bg-emerald-800/40"
          >
            <i.icon className="h-5 w-5 text-gold-400" />
            {t(i.en, i.bn)}
          </Link>
        ))}

        {user && (user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "SUPPORT") && (
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-amber-200 hover:bg-amber-900/30 border border-amber-700/40"
          >
            <Shield className="h-5 w-5" />
            {t("Admin Panel", "অ্যাডমিন প্যানেল")}
          </Link>
        )}

        <div className="mt-auto pt-4 border-t border-emerald-800">
          {user ? (
            <button
              onClick={async () => {
                await logout();
                onClose();
                router.push("/");
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-rose-300 hover:bg-rose-950/40"
            >
              <LogOut className="h-5 w-5" />
              {t("Logout", "লগআউট")}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block text-center rounded-xl bg-gold-500 py-3 font-bold text-emerald-950"
            >
              {t("Login", "লগইন")}
            </Link>
          )}
          <p className="mt-4 text-[10px] leading-relaxed text-emerald-200/50">
            {t(
              "Virtual coins only. Not real gambling. Deposit/withdraw are admin-reviewed play-money requests.",
              "শুধু ভার্চুয়াল কয়েন। আসল জুয়া নয়। ডিপোজিট/উইথড্র অ্যাডমিন-রিভিউড প্লে-মানি রিকোয়েস্ট।"
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
