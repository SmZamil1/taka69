"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  Wallet,
  Shield,
  Gift,
  Download,
  LogOut,
  History,
  Target,
  Share2,
  Copy,
} from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const t = useLang((s) => s.t);
  const router = useRouter();
  const toast = useToast();
  const [shareText, setShareText] = useState("Play TAKA69 with my code!");
  const [bonusAmount, setBonusAmount] = useState(500);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok?.referral || j.data?.referral) {
          const ref = j.data.referral;
          setShareText(ref.shareTextEn || shareText);
          setBonusAmount(ref.bonusAmount || 500);
        }
      })
      .catch(() => {});
  }, []);

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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://taka69.vercel.app";
  const link = `${origin}/register?ref=${user.referralCode}`;
  const fullShare = `${shareText}\n${link}\nCode: ${user.referralCode}`;

  async function copyCode() {
    try {
      const code = user?.referralCode || "";
      await navigator.clipboard.writeText(code);
      toast.success(t("Copied", "কপি হয়েছে"), code);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "TAKA69", text: fullShare, url: link });
      } else {
        await navigator.clipboard.writeText(fullShare);
        toast.success(t("Share text copied", "শেয়ার টেক্সট কপি"));
      }
    } catch {
      /* user cancelled */
    }
  }

  const menu = [
    { href: "/wallet?tab=deposit", icon: Wallet, en: "Deposit", bn: "ডিপোজিট" },
    { href: "/wallet?tab=withdraw", icon: History, en: "Withdraw", bn: "উত্তোলন" },
    { href: "/wallet?tab=history", icon: History, en: "Bet & money history", bn: "বেট ও মানি হিস্ট্রি" },
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
            <div className="text-sm text-gold-300 font-bold">{formatCoins(user.balance)} TK</div>
            <div className="text-xs text-emerald-200/50">{user.role}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {menu.map((m) => (
          <Link key={m.href + m.en} href={m.href} className="premium-card flex items-center gap-2 py-3 hover:border-gold-500/30 transition">
            <m.icon className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-semibold">{t(m.en, m.bn)}</span>
          </Link>
        ))}
      </div>

      <div className="premium-card space-y-3">
        <div className="text-sm font-bold text-gold-300">{t("Referral", "রেফারেল")}</div>
        <p className="text-xs text-emerald-200/60">
          {t(
            `Share your code. You get ${bonusAmount} TK after friend's first approved deposit.`,
            `কোড শেয়ার করুন। বন্ধুর প্রথম অনুমোদিত ডিপোজিটের পর আপনি ${bonusAmount} TK পাবেন।`
          )}
        </p>
        <div className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2">
          <span className="font-mono font-bold text-gold-300">{user.referralCode}</span>
          <button onClick={copyCode} className="rounded-lg p-2 text-emerald-100 hover:bg-white/5">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="break-all rounded-xl bg-black/20 px-3 py-2 text-[11px] text-emerald-100/70">{link}</div>
        <Button className="w-full gap-2" variant="gold" onClick={share}>
          <Share2 className="h-4 w-4" />
          {t("Share invite", "ইনভাইট শেয়ার")}
        </Button>
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
