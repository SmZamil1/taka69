"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCoins } from "@/lib/utils";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Copy,
  Crown,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  Link2,
  LogOut,
  Settings,
  ShieldCheck,
  Smartphone,
  Target,
  Trophy,
  Users,
  WalletCards,
  Percent,
} from "lucide-react";
import { AccountCard, AccountHero } from "@/components/account";

const VIP_NAMES = ["VIP0", "VIP1", "VIP2", "VIP3", "VIP4", "VIP5"];

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const [vipInfo, setVipInfo] = useState<{
    vipExp: number;
    expProgress: number;
    canClaimDaily: boolean;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalDeposit: number;
    totalBet: number;
    totalWin: number;
    totalCommission: number;
    referralCode: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/vip", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setVipInfo(j.data);
      });
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setStats(j.data);
      });
  }, [user?.id]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-[#58728c]">
        <p className="mb-3">{t("Please login", "লগইন করুন")}</p>
        <Link href="/login" className="inline-block rounded-xl bg-[#f4b63e] px-6 py-3 font-black text-[#173251]">
          {t("Login", "লগইন")}
        </Link>
      </div>
    );
  }

  const vipLevel = Math.min(user.vipLevel ?? 0, VIP_NAMES.length - 1);
  const avatar = user.avatar || DEFAULT_PROFILE_AVATAR;
  const refCode = stats?.referralCode || user.username;

  const actions = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "জমা দিন", tone: "bg-[#1f70c1]" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন", tone: "bg-[#3c8fca]" },
    { href: "/wallet?tab=history", icon: CreditCard, en: "My cards", bn: "আমার কার্ড", tone: "bg-[#d4871b]" },
  ];

  const menu = [
    { href: "/wallet?tab=history", icon: FileText, en: "Betting records", bn: "বেটিং রেকর্ড" },
    { href: "/wallet?tab=history", icon: WalletCards, en: "Deposit records", bn: "জমা রেকর্ড" },
    { href: "/wallet?tab=history", icon: BarChart3, en: "Withdraw records", bn: "উত্তোলন রেকর্ড" },
    { href: "/rewards", icon: Trophy, en: "Reward center", bn: "পুরস্কার সেন্টার", badge: 3 },
    { href: "/security", icon: ShieldCheck, en: "Security center", bn: "সুরক্ষা কেন্দ্র" },
    { href: "/referral", icon: Users, en: "Invite friends", bn: "বন্ধুদের আমন্ত্রণ" },
    { href: "/claim-center", icon: Gift, en: "Claim center", bn: "দাবি কেন্দ্র", badge: 4 },
    { href: "/rewards", icon: Target, en: "Missions", bn: "মিশন", badge: 1 },
    { href: "/rebate", icon: Percent, en: "Rebate", bn: "রিবেট" },
    { href: "#support", icon: Headphones, en: "Customer service", bn: "কাস্টমার সার্ভিস" },
    { href: "#app-download", icon: Smartphone, en: "Download app", bn: "অ্যাপ ডাউনলোড" },
  ];

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-4 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-black tracking-tight">{t("My account", "আমার অ্যাকাউন্ট")}</h1>
          <Link href="/profile/settings" className="rounded-full p-2 text-[#58728c] transition hover:bg-[#e8f2fb]" aria-label="Profile settings">
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        <AccountHero
          username={user.username}
          avatar={avatar}
          balance={formatCoins(user.balance)}
          badge={VIP_NAMES[vipLevel]}
          eyebrow={t("Your account", "আপনার অ্যাকাউন্ট")}
          description={`${t("Nickname", "ডাকনাম")}: ${user.username}`}
        >
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <Link href="/vip" className="rounded-xl border border-white/15 bg-black/15 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm font-bold"><Crown className="h-5 w-5 text-[#ffd36a]" /> {t("VIP level", "ভিআইপি লেভেল")}</div>
              <div className="mt-1 text-[11px] text-blue-50/75">{VIP_NAMES[vipLevel]} · {Math.round(vipInfo?.expProgress ?? 0)}% progress</div>
            </Link>
            <Link href="/profile/settings" className="rounded-xl border border-white/15 bg-black/15 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-5 w-5 text-[#b9e8ff]" /> {t("Security", "নিরাপত্তা")}</div>
              <div className="mt-1 text-[11px] text-blue-50/75">{t("Protect your account", "অ্যাকাউন্ট সুরক্ষিত রাখুন")}</div>
            </Link>
          </div>
        </AccountHero>

        <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href + action.en} href={action.href} className={`flex min-h-[4.4rem] min-w-0 items-center justify-center gap-2 rounded-xl ${action.tone} px-2 text-center text-sm font-black text-white shadow-sm active:scale-[0.98]`}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className="leading-tight">{t(action.en, action.bn)}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.en} href={item.href} onClick={(event) => { if (item.href === "#app-download") { event.preventDefault(); window.dispatchEvent(new Event("taka69:open-app-download")); } if (item.href === "#support") { event.preventDefault(); window.dispatchEvent(new Event("taka69:open-support")); } }} className="relative flex min-h-[6.4rem] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[#dce8f2] bg-white px-2 py-3 text-center shadow-[0_7px_22px_rgba(48,89,125,0.08)] transition hover:border-[#91c2ea] hover:bg-[#f8fbfe] active:scale-[0.98]">
                {item.badge ? <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e65c66] px-1 text-[10px] font-black text-white">{item.badge}</span> : null}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2fb] text-[#2675bd]"><Icon className="h-5 w-5" /></span>
                <span className="text-xs font-bold text-[#36516a]">{t(item.en, item.bn)}</span>
              </Link>
            );
          })}
        </div>

        <AccountCard title={t("Invite friends", "বন্ধুদের আমন্ত্রণ জানান")} icon={<Link2 className="h-4 w-4" />}>
          <div className="flex items-center gap-2 rounded-xl bg-[#f4f8fc] p-2">
            <div className="min-w-0 flex-1 truncate text-xs text-[#58728c]">{typeof window !== "undefined" ? `${window.location.origin}/register?ref=${refCode}` : refCode}</div>
            <button type="button" onClick={() => { const url = `${window.location.origin}/register?ref=${refCode}`; navigator.clipboard?.writeText(url); toast.success(t("Copied", "কপি হয়েছে")); }} className="rounded-lg bg-[#f4b63e] p-2 text-[#173251]" aria-label="Copy invite link"><Copy className="h-4 w-4" /></button>
          </div>
        </AccountCard>

        {stats && (
          <div className="grid grid-cols-2 gap-2">
            {[{ en: "Deposit", bn: "জমা", v: stats.totalDeposit }, { en: "Bet", bn: "বেট", v: stats.totalBet }, { en: "Win", bn: "জয়", v: stats.totalWin }, { en: "Commission", bn: "কমিশন", v: stats.totalCommission }].map((stat) => (
              <div key={stat.en} className="rounded-xl border border-[#dce8f2] bg-white p-3 text-center shadow-sm">
                <div className="text-[10px] text-[#8ba0b3]">{t(stat.en, stat.bn)}</div>
                <div className="mt-1 text-sm font-black text-[#d4871b]">৳ {formatCoins(stat.v)}</div>
              </div>
            ))}
          </div>
        )}

        {vipInfo?.canClaimDaily && (
          <button type="button" onClick={async () => { const res = await fetch("/api/vip", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "claim_daily" }) }); const json = await res.json(); if (json.ok) { toast.success(t("Claimed!", "পেয়েছেন!"), `+${json.data.bonus} TK`); setVipInfo((v) => (v ? { ...v, canClaimDaily: false } : v)); } else toast.error(json.error); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4b63e] py-3 text-sm font-black text-[#173251] shadow-sm"><Gift className="h-4 w-4" /> {t("Claim daily VIP bonus", "দৈনিক VIP বোনাস নিন")}</button>
        )}

        <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-3 text-sm font-bold text-[#d65360]"><LogOut className="h-4 w-4" /> {t("Logout", "লগ আউট")}</button>
      </div>
    </div>
  );
}
