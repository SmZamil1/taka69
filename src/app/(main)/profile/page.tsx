"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatCoins } from "@/lib/utils";
import { Crown, Users, Copy, LogOut, Settings, TrendingUp, Wallet } from "lucide-react";

const VIP_NAMES = ["Bronze","Silver","Gold","Platinum","Diamond","Legend"];
const VIP_COLORS = ["#CD7F32","#C0C0C0","#FFD700","#E5E4E2","#b9f2ff","#9b59b6"];
const VIP_ICONS = ["🥉","🥈","🥇","💎","💠","👑"];

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const [vipInfo, setVipInfo] = useState<{ vipExp: number; expProgress: number; canClaimDaily: boolean; currentLevel: { dailyBonus: number; rebateRate: number; withdrawLimit: number } } | null>(null);
  const [stats, setStats] = useState<{ totalDeposit: number; totalBet: number; totalWin: number; totalCommission: number; referralCode: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/vip", { credentials: "include" }).then(r => r.json()).then(j => { if (j.ok) setVipInfo(j.data); });
    fetch("/api/profile", { credentials: "include" }).then(r => r.json()).then(j => { if (j.ok) setStats(j.data); });
  }, [user?.id]); // eslint-disable-line

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
  }

  async function claimDaily() {
    const res = await fetch("/api/vip", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ action: "claim_daily" }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(t("Claimed!", "পেয়েছেন!"), `+${json.data.bonus} TK`);
      setVipInfo(v => v ? { ...v, canClaimDaily: false } : v);
    } else toast.error(json.error);
  }

  if (!user) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-white/50">{t("Please login", "লগইন করুন")}</p>
      <Link href="/login" className="inline-block rounded-xl bg-amber-400 px-6 py-3 font-black text-emerald-950">
        {t("Login", "লগইন")}
      </Link>
    </div>
  );

  const vipLevel = user.vipLevel ?? 0;
  const vipColor = VIP_COLORS[vipLevel] ?? "#FFD700";

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: `linear-gradient(135deg, ${vipColor}22, rgba(0,0,0,0.85))`, border: `1px solid ${vipColor}33` }}>
        <div className="absolute right-4 top-4 text-6xl opacity-15">{VIP_ICONS[vipLevel]}</div>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black text-emerald-950 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${vipColor}, ${vipColor}88)` }}>
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-black text-white">{user.username}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <Crown className="h-3.5 w-3.5" style={{ color: vipColor }} />
              <span className="text-sm font-bold" style={{ color: vipColor }}>
                VIP {vipLevel} — {VIP_NAMES[vipLevel]}
              </span>
            </div>
          </div>
        </div>

        {/* VIP progress */}
        {vipInfo && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${vipInfo.expProgress}%`, background: vipColor }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>{vipInfo.vipExp.toLocaleString()} EXP</span>
              <span>{vipInfo.expProgress.toFixed(0)}% to next level</span>
            </div>
          </div>
        )}

        {/* Balance */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{t("Balance","ব্যালেন্স")}</div>
            <div className="text-2xl font-black text-amber-300">{formatCoins(user.balance)} TK</div>
          </div>
          {vipInfo?.canClaimDaily && vipInfo.currentLevel.dailyBonus > 0 && (
            <button onClick={claimDaily}
              className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-emerald-950 shadow animate-pulse">
              🎁 +{vipInfo.currentLevel.dailyBonus} TK
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("Total Deposit","মোট ডিপোজিট"), value: formatCoins(stats?.totalDeposit ?? 0), icon: <Wallet className="h-4 w-4 text-emerald-400" /> },
          { label: t("Total Bet","মোট বেট"), value: formatCoins(stats?.totalBet ?? 0), icon: <TrendingUp className="h-4 w-4 text-blue-400" /> },
          { label: t("Total Win","মোট জয়"), value: formatCoins(stats?.totalWin ?? 0), icon: <Crown className="h-4 w-4 text-amber-400" /> },
          { label: t("Commissions","কমিশন"), value: formatCoins(stats?.totalCommission ?? 0), icon: <Users className="h-4 w-4 text-purple-400" /> },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-3">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-[11px] text-white/40">{s.label}</span></div>
            <div className="font-black text-white">{s.value} TK</div>
          </div>
        ))}
      </div>

      {/* Referral */}
      {stats?.referralCode && (
        <div className="rounded-2xl border border-emerald-700/30 bg-emerald-900/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/40 uppercase tracking-wider mb-1">{t("Your Referral Code","আপনার রেফারেল কোড")}</div>
              <div className="text-xl font-black text-amber-300">{stats.referralCode}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(stats.referralCode); toast.success(t("Copied!","কপি হয়েছে!")); }}
              className="rounded-xl bg-white/10 p-2.5 hover:bg-white/15">
              <Copy className="h-4 w-4 text-white" />
            </button>
          </div>
          <Link href="/referral" className="mt-3 block text-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-2 text-xs font-bold text-emerald-300">
            {t("View Referral Program →","রেফারেল প্রোগ্রাম দেখুন →")}
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/vip" className="rounded-2xl border border-purple-700/30 bg-purple-900/20 p-4 flex items-center gap-3">
          <Crown className="h-5 w-5 text-purple-400" />
          <div>
            <div className="font-bold text-white text-sm">{t("VIP Program","ভিআইপি প্রোগ্রাম")}</div>
            <div className="text-[10px] text-white/40">{t("Levels & benefits","লেভেল ও সুবিধা")}</div>
          </div>
        </Link>
        <Link href="/referral" className="rounded-2xl border border-emerald-700/30 bg-emerald-900/20 p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="font-bold text-white text-sm">{t("Referrals","রেফারেল")}</div>
            <div className="text-[10px] text-white/40">{t("Earn commissions","কমিশন আয় করুন")}</div>
          </div>
        </Link>
        <Link href="/wallet" className="rounded-2xl border border-amber-700/30 bg-amber-900/20 p-4 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-amber-400" />
          <div>
            <div className="font-bold text-white text-sm">{t("Wallet","ওয়ালেট")}</div>
            <div className="text-[10px] text-white/40">{t("Deposit & withdraw","ডিপোজিট ও উইথড্র")}</div>
          </div>
        </Link>
        <button onClick={logout} className="rounded-2xl border border-rose-700/30 bg-rose-900/20 p-4 flex items-center gap-3">
          <LogOut className="h-5 w-5 text-rose-400" />
          <div className="text-left">
            <div className="font-bold text-white text-sm">{t("Logout","লগআউট")}</div>
            <div className="text-[10px] text-white/40">{t("Sign out","সাইন আউট")}</div>
          </div>
        </button>
      </div>
    </div>
  );
}
