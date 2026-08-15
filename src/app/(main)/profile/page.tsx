"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCoins } from "@/lib/utils";
import {
  Crown,
  Users,
  Copy,
  LogOut,
  Settings,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Shield,
  Link2,
  FileText,
  Target,
  ChevronRight,
  Download,
} from "lucide-react";

const VIP_NAMES = ["VIP0", "VIP1", "VIP2", "VIP3", "VIP4", "VIP5"];
const VIP_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#b9f2ff", "#9b59b6"];

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
      <div className="text-center py-20 space-y-3">
        <p className="text-white/50">{t("Please login", "লগইন করুন")}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-amber-400 px-6 py-3 font-black text-emerald-950"
        >
          {t("Login", "লগইন")}
        </Link>
      </div>
    );
  }

  const vipLevel = user.vipLevel ?? 0;
  const vipColor = VIP_COLORS[Math.min(vipLevel, VIP_COLORS.length - 1)];
  const refCode = stats?.referralCode || user.username;

  const quick = [
    { href: "/wallet?tab=deposit", icon: ArrowDownToLine, en: "Deposit", bn: "ডিপোজিট" },
    { href: "/wallet?tab=withdraw", icon: ArrowUpFromLine, en: "Withdraw", bn: "উত্তোলন করুন" },
    { href: "/rewards", icon: Gift, en: "Rewards", bn: "পুরস্কার", badge: 3 },
    { href: "/referral", icon: Users, en: "Invite", bn: "বন্ধুদের আমন্ত্রণ করুন" },
  ];

  const rows = [
    { href: "/vip", icon: Shield, en: "Security center", bn: "নিরাপত্তা কেন্দ্র" },
    { href: "/referral", icon: Link2, en: "Referral link", bn: "রেফারেল লিঙ্ক" },
    { href: "/wallet?tab=history", icon: FileText, en: "Deposit records", bn: "জমা রেকর্ড" },
    { href: "/wallet?tab=history", icon: FileText, en: "Withdraw records", bn: "উত্তোলন রেকর্ড" },
    { href: "/wallet?tab=history", icon: FileText, en: "Profit & loss", bn: "লাভ এবং লস" },
    { href: "/rewards", icon: Target, en: "Missions", bn: "মিশন", badge: 4 },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-3 pb-24">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-base font-black text-white">{t("Member", "সদস্য")}</h1>
        <Link href="/profile/settings" className="rounded-full p-2 hover:bg-white/5" aria-label="Settings">
          <Settings className="h-5 w-5 text-white/70" />
        </Link>
      </div>

      {/* Profile hero — green JETA7 */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a3d2a] p-4 border border-emerald-700/40">
        <div className="flex items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-emerald-950 ring-2 ring-amber-400/50"
            style={{ background: `linear-gradient(135deg, ${vipColor}, ${vipColor}99)` }}
          >
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-lg font-black text-white">{user.username}</span>
              <span className="rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                {VIP_NAMES[Math.min(vipLevel, VIP_NAMES.length - 1)]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-amber-300 font-black">
              <span>🪙</span> ৳{formatCoins(user.balance)}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/vip"
            className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-black/20 px-3 py-2.5"
          >
            <Crown className="h-5 w-5 text-amber-300" />
            <div>
              <div className="text-[11px] font-bold text-white">{t("VIP", "ভিআইপি")}</div>
              <div className="text-[9px] text-emerald-200/50">{t("Privileges", "ভিপ প্রিভিলেজ")}</div>
            </div>
          </Link>
          <a
            href="#download"
            className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-black/20 px-3 py-2.5"
          >
            <Download className="h-5 w-5 text-amber-300" />
            <div>
              <div className="text-[11px] font-bold text-white">{t("App", "অ্যাপ")}</div>
              <div className="text-[9px] text-emerald-200/50">{t("Download", "ডাউনলোড")}</div>
            </div>
          </a>
        </div>
      </div>

      {/* Quick 4 */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[#0a3d2a] p-3 border border-emerald-800/40">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.href + q.en} href={q.href} className="relative flex flex-col items-center gap-1.5 py-1">
              {"badge" in q && q.badge ? (
                <span className="absolute right-2 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-emerald-950">
                  {q.badge}
                </span>
              ) : null}
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200/20 to-emerald-900/40 text-amber-200">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-center text-[10px] font-bold leading-tight text-emerald-50">
                {t(q.en, q.bn)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* List rows */}
      <div className="overflow-hidden rounded-2xl border border-emerald-800/40 bg-[#0a3d2a]">
        {rows.map((r, idx) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.en + idx}
              href={r.href}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5 last:border-0 hover:bg-white/5"
            >
              <Icon className="h-5 w-5 text-emerald-200/80" />
              <span className="flex-1 text-sm font-semibold text-white">{t(r.en, r.bn)}</span>
              {"badge" in r && r.badge ? (
                <span className="mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-emerald-950">
                  {r.badge}
                </span>
              ) : null}
              <ChevronRight className="h-4 w-4 text-white/30" />
            </Link>
          );
        })}
      </div>

      {/* Referral code */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="text-[10px] text-white/40">{t("Your invite code", "আপনার আমন্ত্রণ কোড")}</div>
          <div className="font-black text-amber-300 tracking-wider">{refCode}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            const url =
              typeof window !== "undefined"
                ? `${window.location.origin}/register?ref=${refCode}`
                : refCode;
            navigator.clipboard?.writeText(url);
            toast.success(t("Copied", "কপি হয়েছে"));
          }}
          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-emerald-950"
        >
          <Copy className="inline h-3.5 w-3.5 mr-1" />
          {t("Copy", "কপি")}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { en: "Deposit", bn: "ডিপোজিট", v: stats.totalDeposit },
            { en: "Bet", bn: "বেট", v: stats.totalBet },
            { en: "Win", bn: "জয়", v: stats.totalWin },
            { en: "Commission", bn: "কমিশন", v: stats.totalCommission },
          ].map((s) => (
            <div key={s.en} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] text-white/40">{t(s.en, s.bn)}</div>
              <div className="text-sm font-black text-amber-300">{formatCoins(s.v)}</div>
            </div>
          ))}
        </div>
      )}

      {vipInfo?.canClaimDaily && (
        <button
          type="button"
          onClick={async () => {
            const res = await fetch("/api/vip", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ action: "claim_daily" }),
            });
            const json = await res.json();
            if (json.ok) {
              toast.success(t("Claimed!", "পেয়েছেন!"), `+${json.data.bonus} TK`);
              setVipInfo((v) => (v ? { ...v, canClaimDaily: false } : v));
            } else toast.error(json.error);
          }}
          className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 py-3 text-sm font-black text-emerald-950"
        >
          {t("Claim daily VIP bonus", "দৈনিক VIP বোনাস নিন")}
        </button>
      )}

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 py-3 text-sm font-bold text-rose-300"
      >
        <LogOut className="h-4 w-4" />
        {t("Logout", "লগ আউট")}
      </button>
    </div>
  );
}
