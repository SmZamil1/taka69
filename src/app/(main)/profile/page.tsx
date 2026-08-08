"use client";

import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const t = useLang((s) => s.t);
  const router = useRouter();

  if (!user) {
    return (
      <div className="card text-center space-y-3">
        <p>{t("Login to view profile", "প্রোফাইল দেখতে লগইন করুন")}</p>
        <div className="flex gap-2 justify-center">
          <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
          <Link href="/register"><Button variant="gold">{t("Register", "নিবন্ধন")}</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-amber-700 text-2xl font-black text-emerald-950">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold">{user.username}</div>
          <div className="text-sm text-gold-300">{formatCoins(user.balance)} TC</div>
          <div className="text-xs text-emerald-200/50">{user.role}</div>
        </div>
      </div>

      <div className="card space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-emerald-200/60">{t("Referral code", "রেফারেল কোড")}</span>
          <span className="font-mono font-bold text-gold-300">{user.referralCode}</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Link href="/wallet"><Button variant="soft" className="w-full">{t("Wallet", "ওয়ালেট")}</Button></Link>
        <Link href="/rewards"><Button variant="soft" className="w-full">{t("Missions", "মিশন")}</Button></Link>
        {(user.role === "ADMIN" || user.role === "MODERATOR") && (
          <Link href="/admin"><Button variant="gold" className="w-full">{t("Admin Panel", "অ্যাডমিন প্যানেল")}</Button></Link>
        )}
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          {t("Logout", "লগআউট")}
        </Button>
      </div>
    </div>
  );
}
