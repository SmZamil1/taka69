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
  Target,
  Trophy,
  Users,
  WalletCards,
  Smartphone,
  Percent,
} from "lucide-react";

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
      <div className="py-20 text-center">
        <p className="mb-3 text-white/50">{t("Please login", "লগইন করুন")}</p>
        <Link href="/login" className="inline-block rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950">
          {t("Login", "লগইন")}
        </Link>
      </div>
    );
  }

  const vipLevel = Math.min(user.vipLevel ?? 0, VIP_NAMES.length - 1);
  const avatar = user.avatar || DEFAULT_PROFILE_AVATAR;
  const refCode = stats?.referralCode || user.username;

  const actions = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "জমা দিন", tone: "from-amber-300 to-orange-400" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন", tone: "from-emerald-400 to-teal-500" },
    { href: "/wallet?tab=history", icon: CreditCard, en: "My cards", bn: "আমার কার্ড", tone: "from-slate-500 to-slate-700" },
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
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#050505] px-3 pb-24 pt-4 text-white">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-black tracking-tight">{t("My account", "আমার অ্যাকাউন্ট")}</h1>
          <Link href="/profile/settings" className="rounded-full p-2 text-white/65 transition hover:bg-white/10" aria-label="Profile settings">
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-[#171717] via-[#22201d] to-[#6f501c] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
          <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-72 rotate-[18deg] rounded-[40%] bg-gradient-to-br from-amber-300/80 to-yellow-600/25 blur-[1px]" />
          <div className="relative flex items-center gap-3">
            <div
              className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl border-2 border-amber-200/70 bg-cover bg-center shadow-xl"
              style={{ backgroundImage: `url(${avatar})` }}
              role="img"
              aria-label={`${user.username} profile picture`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[1.35rem] font-black">{user.username}</span>
                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-black text-amber-200">
                  {VIP_NAMES[vipLevel]}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/45">{t("Nickname", "ডাকনাম")}: {user.username}</div>
              <div className="mt-1 text-lg font-black text-white">৳ {formatCoins(user.balance)}</div>
            </div>
            <Link href="/profile/settings" className="rounded-full bg-white/10 p-2 text-white/70" aria-label="Edit profile">
              <Settings className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2">
            <Link href="/vip" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm font-bold"><Crown className="h-5 w-5 text-amber-300" /> {t("VIP level", "ভিআইপি লেভেল")}</div>
              <div className="mt-1 text-[11px] text-white/45">{VIP_NAMES[vipLevel]} · {Math.round(vipInfo?.expProgress ?? 0)}% progress</div>
            </Link>
            <Link href="/profile/settings" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-5 w-5 text-emerald-300" /> {t("Security", "নিরাপত্তা")}</div>
              <div className="mt-1 text-[11px] text-white/45">{t("Protect your account", "অ্যাকাউন্ট সুরক্ষিত রাখুন")}</div>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href + action.en} href={action.href} className={`flex min-h-[4.4rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r ${action.tone} px-2 text-center text-sm font-black text-white shadow-lg active:scale-[0.98]`}>
                <Icon className="h-5 w-5" />
                <span className="leading-tight">{t(action.en, action.bn)}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.en} href={item.href} onClick={(event) => { if (item.href === "#app-download") { event.preventDefault(); window.dispatchEvent(new Event("taka69:open-app-download")); } if (item.href === "#support") { event.preventDefault(); window.dispatchEvent(new Event("taka69:open-support")); } }} className="relative flex min-h-[6.4rem] flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a] px-2 py-3 text-center shadow-[0_6px_18px_rgba(0,0,0,0.22)] transition hover:border-amber-300/30 hover:bg-[#232323] active:scale-[0.98]">
                {item.badge ? <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black">{item.badge}</span> : null}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/10 text-amber-300"><Icon className="h-5 w-5" /></span>
                <span className="text-xs font-bold text-white/90">{t(item.en, item.bn)}</span>
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#151515] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white/55"><Link2 className="h-4 w-4 text-amber-300" /> {t("Invite friends", "বন্ধুদের আমন্ত্রণ জানান")}</div>
          <div className="flex items-center gap-2 rounded-xl bg-black/30 p-2">
            <div className="min-w-0 flex-1 truncate text-xs text-white/70">{typeof window !== "undefined" ? `${window.location.origin}/register?ref=${refCode}` : refCode}</div>
            <button type="button" onClick={() => { const url = `${window.location.origin}/register?ref=${refCode}`; navigator.clipboard?.writeText(url); toast.success(t("Copied", "কপি হয়েছে")); }} className="rounded-lg bg-amber-300 p-2 text-slate-950" aria-label="Copy invite link"><Copy className="h-4 w-4" /></button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2">
            {[{ en: "Deposit", bn: "জমা", v: stats.totalDeposit }, { en: "Bet", bn: "বেট", v: stats.totalBet }, { en: "Win", bn: "জয়", v: stats.totalWin }, { en: "Commission", bn: "কমিশন", v: stats.totalCommission }].map((stat) => (
              <div key={stat.en} className="rounded-xl border border-white/10 bg-[#141414] p-3 text-center">
                <div className="text-[10px] text-white/40">{t(stat.en, stat.bn)}</div>
                <div className="mt-1 text-sm font-black text-amber-300">৳ {formatCoins(stat.v)}</div>
              </div>
            ))}
          </div>
        )}

        {vipInfo?.canClaimDaily && (
          <button type="button" onClick={async () => { const res = await fetch("/api/vip", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "claim_daily" }) }); const json = await res.json(); if (json.ok) { toast.success(t("Claimed!", "পেয়েছেন!"), `+${json.data.bonus} TK`); setVipInfo((v) => (v ? { ...v, canClaimDaily: false } : v)); } else toast.error(json.error); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 py-3 text-sm font-black text-slate-950"><Gift className="h-4 w-4" /> {t("Claim daily VIP bonus", "দৈনিক VIP বোনাস নিন")}</button>
        )}

        <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 py-3 text-sm font-bold text-rose-300"><LogOut className="h-4 w-4" /> {t("Logout", "লগ আউট")}</button>
      </div>
    </div>
  );
}
