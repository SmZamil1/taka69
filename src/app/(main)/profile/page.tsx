"use client";

import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Shield,
  Gift,
  Download,
  LogOut,
  History,
  Target,
} from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const t = useLang((s) => s.t);
  const router = useRouter();

  if (!user) {
    return (
      <div className="premium-card text-center space-y-3">
        <p>{t("Login to view profile", "প্রোফাইল দেখতে লগইন করুন")}</p>
        <div className="flex gap-2 justify-center">
          <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
          <Link href="/register"><Button variant="gold">{t("Register", "নিবন্ধন")}</Button></Link>
        </div>
      </div>
    );
  }

  const menu = [
    { href: "/wallet?tab=deposit", icon: Wallet, en: "Deposit", bn: "ডিপোজিট" },
    { href: "/wallet?tab=withdraw", icon: History, en: "Withdraw", bn: "উত্তোলন" },
    { href: "/rewards", icon: Gift, en: "Rewards / Claims", bn: "পুরস্কার / দাবি" },
    { href: "/rewards?tab=missions", icon: Target, en: "Missions", bn: "মিশন" },
    { href: "/#download", icon: Download, en: "App Download", bn: "অ্যাপ ডাউনলোড" },
  ];

  return (
    <div className="space-y-4">
      <div className="premium-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/40 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-amber-700 text-2xl font-black text-emerald-950 ring-2 ring-gold-400/40">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-black">{user.username}</div>
              <span className="rounded-md bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-300">VIP0</span>
            </div>
            <div className="text-sm text-gold-300 font-bold">{formatCoins(user.balance)} TC</div>
            <div className="text-xs text-emerald-200/50">{user.role}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} className="premium-card flex items-center gap-2 py-3 hover:border-gold-500/30 transition">
            <m.icon className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-semibold">{t(m.en, m.bn)}</span>
          </Link>
        ))}
      </div>

      <div className="premium-card space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-emerald-200/60">{t("Referral code", "রেফারেল কোড")}</span>
          <span className="font-mono font-bold text-gold-300">{user.referralCode}</span>
        </div>
      </div>

      <div className="grid gap-2">
        {(user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "SUPPORT") && (
          <Link href="/admin">
            <Button variant="gold" className="w-full gap-2">
              <Shield className="h-4 w-4" />
              {t("Admin Panel", "অ্যাডমিন প্যানেল")}
            </Button>
          </Link>
        )}
        <Button
          variant="danger"
          className="w-full gap-2"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("Logout", "লগআউট")}
        </Button>
      </div>
    </div>
  );
}
