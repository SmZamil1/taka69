"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  BarChart3,
  CircleHelp,
  Copy,
  CreditCard,
  Download,
  FileText,
  Headphones,
  Mail,
  Percent,
  ShieldCheck,
  Smartphone,
  Target,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";
import { formatCoins } from "@/lib/utils";

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E4B94A";
const GREEN = "#1DBF73";
const BG = "#111111";
const CARD_BG = "#1A1A1A";
const TILE_BG = "#1E1E1E";
const TEXT_MUTED = "#888";

const VIP_NAMES = ["VIP0", "VIP1", "VIP2", "VIP3", "VIP4", "VIP5"];

type Profile = {
  username: string;
  email?: string | null;
  phone?: string | null;
  balance: number;
  vipLevel: number;
  vipExp?: number;
  totalDeposit: number;
  totalBet: number;
  totalWin: number;
  totalCommission: number;
  referralCode: string;
  avatar?: string | null;
};

type PaymentMethod = {
  id: string;
  name: string;
  logo?: string;
  enabled?: boolean;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
};

type MenuItem = {
  href: string;
  icon: LucideIcon;
  en: string;
  bn: string;
  badge?: number;
};

const MENU_ITEMS: MenuItem[] = [
  { href: "/wallet/records?view=bets", icon: FileText, en: "Betting records", bn: "বেটিং রেকর্ড" },
  { href: "/wallet/records?view=requests&type=DEPOSIT", icon: FileText, en: "Deposit records", bn: "জমা রেকর্ড" },
  { href: "/wallet/records?view=requests&type=WITHDRAW", icon: FileText, en: "Withdraw records", bn: "উতোলন রেকর্ড" },
  { href: "/rewards", icon: Trophy, en: "Reward center", bn: "পুরস্কার সেন্টার", badge: 4 },
  { href: "/security", icon: ShieldCheck, en: "Security center", bn: "সুরক্ষা কেন্দ্র" },
  { href: "/referral", icon: Users, en: "Invite friends", bn: "বন্ধুদের আমন্ত্রণ জানান" },
  { href: "/profile/settings", icon: UserRound, en: "Account records", bn: "অ্যাকাউন্ট রেকর্ড" },
  { href: "/wallet/records?view=money", icon: BarChart3, en: "Profit and loss", bn: "লাভ এবং লস" },
  { href: "/rebate", icon: Percent, en: "Rebate", bn: "রিবেট" },
  { href: "/claim-center", icon: Target, en: "Missions", bn: "মিশন", badge: 1 },
  { href: "#support", icon: Headphones, en: "Advice", bn: "পরামর্শ" },
  { href: "#mail", icon: Mail, en: "Mail", bn: "মেইল", badge: 8 },
  { href: "#support", icon: Headphones, en: "Customer service", bn: "কাস্টমার সার্ভিস" },
  { href: "#app-download", icon: Smartphone, en: "Download app", bn: "অ্যাপ ডাউনলোড করুন" },
  { href: "/security", icon: CircleHelp, en: "Help center", bn: "সাহায্য কেন্দ্র" },
];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  if (!value || typeof value !== "object") return false;
  const method = value as Record<string, unknown>;
  return Boolean(
    method.id &&
      method.name &&
      method.enabled !== false &&
      (method.depositEnabled !== false || method.withdrawEnabled !== false),
  );
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const t = useLang((state) => state.t);
  const toast = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/api/auth/me", { credentials: "include" }).then((response) => response.json()),
      fetch("/api/profile", { credentials: "include" }).then((response) => response.json()),
      fetch("/api/wallet/request", { credentials: "include" }).then((response) => response.json()),
    ])
      .then(([sessionJson, profileJson, walletJson]) => {
        if (cancelled) return;
        if (sessionJson.ok && sessionJson.data) setUser(sessionJson.data);
        if (profileJson.ok && profileJson.data) setProfile(profileJson.data);
        if (walletJson.ok && Array.isArray(walletJson.data?.paymentConfig?.methods)) {
          setPaymentMethods(walletJson.data.paymentConfig.methods.filter(isPaymentMethod).slice(0, 6));
        }
      })
      .catch(() => {
        // The auth store remains the safe fallback when a secondary profile request fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser, user?.id]);

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

  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] px-4 py-20 text-center" style={{ background: BG, color: "white" }}>
        <p className="mb-3">{t("Please login", "লগইন করুন")}</p>
        <Link href="/login" className="inline-block rounded-full px-6 py-3 font-black" style={{ background: GOLD_LIGHT, color: "#161616" }}>
          {t("Login", "লগইন")}
        </Link>
      </div>
    );
  }

  const data = profile || {
    username: user.username,
    balance: user.balance,
    vipLevel: user.vipLevel,
    vipExp: 0,
    totalDeposit: 0,
    totalBet: 0,
    totalWin: 0,
    totalCommission: 0,
    referralCode: user.username,
    avatar: user.avatar,
  };
  const vipLevel = Math.min(Math.max(Number(data.vipLevel || 0), 0), VIP_NAMES.length - 1);
  const avatar = data.avatar || user.avatar || DEFAULT_PROFILE_AVATAR;
  const refCode = data.referralCode || data.username;
  const points = Math.max(0, Math.round(Number(data.vipExp || 0)));
  const visiblePaymentMethods = paymentMethods.length > 0 ? paymentMethods : [{ id: "wallet", name: "eWallet", logo: "/icons/logo.png" }];

  const actions = [
    { href: "/wallet/deposit", icon: ArrowDownToLine, label: t("Deposit", "জমা দিন"), background: GOLD_LIGHT, color: "#000" },
    { href: "/wallet/withdraw", icon: ArrowUpFromLine, label: t("Withdraw", "উতোলন"), background: GREEN, color: "white" },
    { href: "/wallet/cards", icon: CreditCard, label: t("My cards", "আমার কার্ড"), background: "#2A2A2A", color: "white" },
  ];

  return (
    <div
      className="mx-auto min-h-[calc(100dvh-5rem)] max-w-[430px] overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]"
      style={{ background: BG, color: "white", fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}
    >
      <header className="sticky top-0 z-10 flex items-center px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))]" style={{ background: BG }}>
        <button type="button" onClick={() => router.back()} className="mr-2 rounded-full p-1" aria-label={t("Back", "পিছনে")}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="m-0 flex-1 text-center text-xl font-bold tracking-[0.3px]">{t("My account", "আমার অ্যাকাউন্ট")}</h1>
        <Link href="/profile/settings" className="rounded-full p-1 text-white" aria-label={t("Account settings", "অ্যাকাউন্ট সেটিংস")}>
          <WalletCards className="h-6 w-6" />
        </Link>
      </header>

      <section className="px-3.5 pb-3.5">
        <div className="relative overflow-hidden rounded-2xl" style={{ background: CARD_BG }}>
          <div
            className="absolute right-0 top-0 z-0 h-[110px] w-40"
            style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, borderRadius: "0 16px 0 80%" }}
          />
          <Link
            href="/profile/settings"
            className="absolute right-[18px] top-4 z-10 rounded-full border border-white/30 bg-black/25 px-4 py-1.5 text-[13px] font-semibold text-white backdrop-blur"
          >
            {t("Settings", "সেটিংস")}
          </Link>

          <div className="relative z-[1] flex items-center gap-3 px-4 pb-3.5 pt-[18px]">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border-2" style={{ borderColor: GOLD }}>
              <img src={avatar} alt={data.username} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="truncate text-[17px] font-bold">{loading ? "…" : data.username}</span>
                <span className="shrink-0 text-xs font-bold" style={{ color: GOLD }}>
                  ★ VIP {loading ? "…" : vipLevel}
                </span>
              </div>
              <span className="text-[13px]" style={{ color: TEXT_MUTED }}>
                {t("Nickname", "ডাকনাম")}: {loading ? "…" : data.username}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 px-3 pb-4">
            <div className="rounded-[10px] px-3.5 py-2.5 text-center" style={{ background: "#252525" }}>
              <div className="mb-1 text-[13px]" style={{ color: TEXT_MUTED }}>{t("Balance", "ব্যালেন্স")}</div>
              <div className="text-[17px] font-bold">{loading ? "…" : `৳ ${formatCoins(data.balance)}`}</div>
            </div>
            <div className="rounded-[10px] px-3.5 py-2.5 text-center" style={{ background: "#252525" }}>
              <div className="mb-1 text-[13px]" style={{ color: TEXT_MUTED }}>{t("Points", "পয়েন্টস")}</div>
              <div className="text-[17px] font-bold">{loading ? "…" : points.toLocaleString("en-BD")}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-2.5 px-3.5 pb-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-1 py-2.5 text-[15px] font-bold"
              style={{ background: action.background, color: action.color }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{action.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto px-3.5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visiblePaymentMethods.map((method) => (
          <Link
            key={method.id}
            href={`/wallet?tab=${method.depositEnabled !== false ? "deposit" : "withdraw"}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ background: TILE_BG }}
            title={method.name}
          >
            {/* Payment logos are configured by the same-origin wallet API. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={method.logo || "/icons/logo.png"} alt={method.name} width={36} height={36} className="h-9 w-9 rounded-md object-contain" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2.5 px-3.5 pb-6">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.en}`}
              href={item.href}
              onClick={(event) => handleMenuClick(event, item)}
              className="relative flex min-h-[90px] flex-col items-center justify-center gap-2 rounded-xl border px-1.5 py-3 text-center transition active:scale-[0.98]"
              style={{ background: TILE_BG, borderColor: "#2A2A2A" }}
            >
              {item.badge !== undefined && (
                <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[10px] bg-[#E53935] px-1 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
              <Icon className="h-7 w-7" style={{ color: GOLD }} strokeWidth={1.8} />
              <span className="text-[11px] font-medium leading-[1.3] text-[#CCC]">{t(item.en, item.bn)}</span>
            </Link>
          );
        })}
      </div>

      <div className="mx-3.5 rounded-xl border p-3" style={{ background: TILE_BG, borderColor: "#2A2A2A" }}>
        <div className="mb-2 text-xs font-bold" style={{ color: TEXT_MUTED }}>{t("Invite link", "ইনভাইট লিংক")}</div>
        <div className="flex items-center gap-2 rounded-lg bg-black/30 p-2">
          <div className="min-w-0 flex-1 truncate text-[11px] text-white/60">
            {typeof window !== "undefined" ? `${window.location.origin}/register?ref=${refCode}` : refCode}
          </div>
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/register?ref=${refCode}`;
              navigator.clipboard?.writeText(url);
              toast.success(t("Copied", "কপি হয়েছে"));
            }}
            className="rounded-lg p-2"
            style={{ background: GOLD, color: "#171717" }}
            aria-label={t("Copy invite link", "ইনভাইট লিংক কপি করুন")}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3.5 py-4">
        {[
          { en: "Deposit", bn: "জমা", value: data.totalDeposit },
          { en: "Bet", bn: "বেট", value: data.totalBet },
          { en: "Win", bn: "জয়", value: data.totalWin },
          { en: "Commission", bn: "কমিশন", value: data.totalCommission },
        ].map((item) => (
          <div key={item.en} className="rounded-xl border p-3 text-center" style={{ background: TILE_BG, borderColor: "#2A2A2A" }}>
            <div className="text-[10px]" style={{ color: TEXT_MUTED }}>{t(item.en, item.bn)}</div>
            <div className="mt-1 text-sm font-black" style={{ color: GOLD_LIGHT }}>৳ {formatCoins(item.value)}</div>
          </div>
        ))}
      </div>

      <Link href="/profile/settings" className="mx-3.5 flex items-center justify-center gap-2 rounded-full border border-rose-400/30 bg-[#1A1A1A] py-3 text-sm font-bold text-rose-300">
        <Download className="h-4 w-4" />
        {t("Manage account", "অ্যাকাউন্ট পরিচালনা করুন")}
      </Link>
    </div>
  );
}
