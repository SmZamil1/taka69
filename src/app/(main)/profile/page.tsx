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
  ArrowLeft,
  ArrowUpFromLine,
  BarChart3,
  Copy,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  HelpCircle,
  LogOut,
  Mail,
  Percent,
  Smartphone,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";

const VIP_NAMES = ["VIP0", "VIP1", "VIP2", "VIP3", "VIP4", "VIP5"];

type MenuItem = {
  href: string;
  icon: typeof FileText;
  en: string;
  bn: string;
  badge?: number;
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const [vipInfo, setVipInfo] = useState<{ vipExp: number; expProgress: number; canClaimDaily: boolean } | null>(null);
  const [stats, setStats] = useState<{ totalDeposit: number; totalBet: number; totalWin: number; totalCommission: number; referralCode: string } | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; logo?: string; depositEnabled?: boolean; withdrawEnabled?: boolean }>>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/vip", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) setVipInfo(j.data); })
      .catch(() => {});
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) setStats(j.data); })
      .catch(() => {});
    fetch("/api/wallet/request", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok || !Array.isArray(j.data?.paymentConfig?.methods)) return;
        setPaymentMethods(j.data.paymentConfig.methods.filter((item: unknown): item is { id: string; name: string; logo?: string; depositEnabled?: boolean; withdrawEnabled?: boolean } => {
          if (!item || typeof item !== "object") return false;
          const value = item as Record<string, unknown>;
          return Boolean(value.id && value.name && value.enabled !== false && (value.depositEnabled !== false || value.withdrawEnabled !== false));
        }).slice(0, 5));
      })
      .catch(() => {});
  }, [user]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] bg-black px-4 py-20 text-center text-white">
        <p className="mb-3">{t("Please login", "লগইন করুন")}</p>
        <Link href="/login" className="inline-block rounded-full bg-[#f3c96b] px-6 py-3 font-black text-[#161616]">{t("Login", "লগইন")}</Link>
      </div>
    );
  }

  const vipLevel = Math.min(user.vipLevel ?? 0, VIP_NAMES.length - 1);
  const avatar = user.avatar || DEFAULT_PROFILE_AVATAR;
  const refCode = stats?.referralCode || user.username;
  const points = Math.max(0, Math.round(vipInfo?.vipExp ?? 0));

  const actions = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "জমা দিন", className: "bg-[#f3ce78] text-[#171717]" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন", className: "bg-[#1db65d] text-white" },
    { href: "/wallet/cards", icon: CreditCard, en: "My cards", bn: "আমার কার্ড", className: "border border-white/15 bg-[#202020] text-white" },
  ];

  const menu: MenuItem[] = [
    { href: "/wallet/records?view=bets", icon: FileText, en: "Betting records", bn: "বেটিং রেকর্ড" },
    { href: "/wallet/records?view=requests&type=DEPOSIT", icon: WalletCards, en: "Deposit records", bn: "জমা রেকর্ড" },
    { href: "/wallet/records?view=requests&type=WITHDRAW", icon: BarChart3, en: "Withdraw records", bn: "উতোলন রেকর্ড" },
    { href: "/rewards", icon: Trophy, en: "Reward center", bn: "পুরস্কার সেন্টার", badge: 4 },
    { href: "/security", icon: ShieldCheck, en: "Security center", bn: "সুরক্ষা কেন্দ্র" },
    { href: "/referral", icon: Users, en: "Invite friends", bn: "বন্ধুদের আমন্ত্রণ" },
    { href: "/profile/settings", icon: FileText, en: "Account records", bn: "অ্যাকাউন্ট রেকর্ড" },
    { href: "/wallet?tab=history&view=money", icon: BarChart3, en: "Profit and loss", bn: "লাভ এবং লস" },
    { href: "/rebate", icon: Percent, en: "Rebate", bn: "রিবেট" },
    { href: "/rewards", icon: Target, en: "Missions", bn: "মিশন", badge: 1 },
    { href: "#support", icon: Headphones, en: "Advice", bn: "পরামর্শ" },
    { href: "#mail", icon: Mail, en: "Mail", bn: "মেইল", badge: 8 },
    { href: "#support", icon: Headphones, en: "Customer service", bn: "কাস্টমার সার্ভিস" },
    { href: "#app-download", icon: Smartphone, en: "Download app", bn: "অ্যাপ ডাউনলোড করুন" },
    { href: "/security", icon: HelpCircle, en: "Help center", bn: "সাহায্য কেন্দ্র" },
  ];

  function handleMenuClick(event: React.MouseEvent<HTMLAnchorElement>, item: MenuItem) {
    if (item.href === "#app-download") {
      event.preventDefault();
      window.dispatchEvent(new Event("taka69:open-app-download"));
    }
    if (item.href === "#support") {
      event.preventDefault();
      window.dispatchEvent(new Event("taka69:open-support"));
    }
    if (item.href === "#mail") {
      event.preventDefault();
      toast.success(t("Mail opened", "মেইল খোলা হয়েছে"));
    }
  }

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100dvh-5rem)] bg-black px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(0.8rem+env(safe-area-inset-top))] text-white">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-3 px-1">
          <button type="button" onClick={() => router.back()} className="rounded-full p-1 text-white" aria-label="Back"><ArrowLeft className="h-8 w-8" /></button>
          <h1 className="flex-1 text-center text-[clamp(1.55rem,5vw,2.4rem)] font-black tracking-tight">{t("My account", "আমার অ্যাকাউন্ট")}</h1>
          <span className="w-8" />
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2b2b2b] via-[#242424] to-[#171717] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.38)] sm:p-7">
          <div className="pointer-events-none absolute -right-14 -top-16 h-64 w-80 rotate-[20deg] rounded-[4rem] bg-gradient-to-br from-[#f7d27f] via-[#efb836] to-[#eba91c] shadow-[-20px_18px_36px_rgba(230,166,28,0.24)]" />
          <div className="relative z-10 flex items-start gap-4 sm:gap-5">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-[#3d3d3d] p-3 shadow-inner sm:h-24 sm:w-24">
              <div className="h-full w-full rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${avatar})` }} role="img" aria-label={user.username} />
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-3xl font-black tracking-tight sm:text-4xl">{user.username}</h2>
                <span className="text-xl font-black text-[#f5cd77]">{VIP_NAMES[vipLevel]}</span>
              </div>
              <p className="mt-2 text-base text-white/45 sm:text-lg">{t("Nickname", "ডাকনাম")}: {user.username}</p>
            </div>
          </div>
          <div className="relative z-10 mt-24 grid grid-cols-2 gap-3 sm:mt-28 sm:gap-5">
            <div className="rounded-2xl bg-[#3a3a3a] px-3 py-4 text-center shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
              <div className="text-xl font-bold text-white/75 sm:text-2xl">{t("Balance", "ব্যালেন্স")}</div>
              <div className="mt-2 text-2xl font-black sm:text-3xl">৳ {formatCoins(user.balance)}</div>
            </div>
            <div className="rounded-2xl bg-[#3a3a3a] px-3 py-4 text-center shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
              <div className="text-xl font-bold text-white/75 sm:text-2xl">{t("Points", "পয়েন্টস")}</div>
              <div className="mt-2 text-2xl font-black sm:text-3xl">{points.toLocaleString()}</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return <Link key={action.href} href={action.href} className={`flex min-h-[4.5rem] items-center justify-center gap-2 rounded-full px-2 text-center text-base font-black shadow-[0_8px_18px_rgba(0,0,0,0.28)] active:scale-[0.98] sm:text-xl ${action.className}`}><Icon className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" /><span>{t(action.en, action.bn)}</span></Link>;
          })}
        </div>

        {paymentMethods.length > 0 && <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#1e1e1e] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{t("Payment methods", "পেমেন্ট পদ্ধতি")}</span>
          {paymentMethods.map((item) => <Link key={item.id} href={`/wallet?tab=${item.depositEnabled !== false ? "deposit" : "withdraw"}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25 ring-1 ring-white/10 transition hover:ring-[#f3ce78]/70" title={item.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.logo || "/icons/logo.png"} alt={item.name} className="h-7 w-7 rounded object-contain" />
          </Link>)}
        </div>}

        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return <Link key={item.en} href={item.href} onClick={(event) => handleMenuClick(event, item)} className="relative flex min-h-[8.2rem] flex-col items-center justify-center gap-3 rounded-2xl border border-[#3b3b3b] bg-[#1e1e1e] px-1.5 py-3 text-center shadow-[0_8px_18px_rgba(0,0,0,0.32)] transition hover:border-[#dcae45] hover:bg-[#252525] active:scale-[0.98] sm:min-h-[9rem]">
              {item.badge ? <span className="absolute right-1.5 top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e83f5b] px-1.5 text-sm font-black text-white">{item.badge}</span> : null}
              <Icon className="h-10 w-10 text-[#f3ce78] sm:h-12 sm:w-12" strokeWidth={1.8} />
              <span className="text-[0.78rem] font-black leading-tight text-white sm:text-base">{t(item.en, item.bn)}</span>
            </Link>;
          })}
        </div>

        <div className="rounded-2xl border border-[#3b3b3b] bg-[#1e1e1e] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
          <div className="mb-2 text-sm font-bold text-white/55">{t("Invite link", "ইনভাইট লিংক")}</div>
          <div className="flex items-center gap-2 rounded-xl bg-black/30 p-2">
            <div className="min-w-0 flex-1 truncate text-xs text-white/55">{typeof window !== "undefined" ? `${window.location.origin}/register?ref=${refCode}` : refCode}</div>
            <button type="button" onClick={() => { const url = `${window.location.origin}/register?ref=${refCode}`; navigator.clipboard?.writeText(url); toast.success(t("Copied", "কপি হয়েছে")); }} className="rounded-lg bg-[#f3ce78] p-2 text-[#171717]" aria-label="Copy invite link"><Copy className="h-4 w-4" /></button>
          </div>
        </div>

        {stats && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
          { en: "Deposit", bn: "জমা", value: stats.totalDeposit },
          { en: "Bet", bn: "বেট", value: stats.totalBet },
          { en: "Win", bn: "জয়", value: stats.totalWin },
          { en: "Commission", bn: "কমিশন", value: stats.totalCommission },
        ].map((item) => <div key={item.en} className="rounded-xl border border-[#3b3b3b] bg-[#1e1e1e] p-3 text-center"><div className="text-[10px] text-white/45">{t(item.en, item.bn)}</div><div className="mt-1 text-sm font-black text-[#f3ce78]">৳ {formatCoins(item.value)}</div></div>)}</div>}

        {vipInfo?.canClaimDaily && <button type="button" onClick={async () => { const res = await fetch("/api/vip", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "claim_daily" }) }); const json = await res.json(); if (json.ok) { toast.success(t("Claimed!", "পেয়েছেন!"), `+${json.data.bonus} TK`); setVipInfo((value) => value ? { ...value, canClaimDaily: false } : value); } else toast.error(json.error); }} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f3ce78] py-3 text-sm font-black text-[#171717]"><Gift className="h-4 w-4" />{t("Claim daily VIP bonus", "দৈনিক VIP বোনাস নিন")}</button>}
        <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-400/30 bg-[#1e1e1e] py-3 text-sm font-bold text-rose-300"><LogOut className="h-4 w-4" />{t("Logout", "লগ আউট")}</button>
      </div>
    </div>
  );
}
