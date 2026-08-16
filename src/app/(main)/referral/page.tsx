"use client";

import { useEffect, useState } from "react";
import { Copy, Gift, TrendingUp, Users } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { AccountCard, AccountHeader, AccountHero, EmptyState, FloatingAccountActions } from "@/components/account";

type RefStats = {
  referralCode: string; referralLink: string; totalCommission: number;
  directReferrals: Array<{ id: string; username: string; createdAt: string; totalDeposit: number; totalBet: number }>;
  byLevel: Array<{ level: number; count: number; earned: number }>;
};

export default function ReferralPage() {
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [stats, setStats] = useState<RefStats | null>(null);

  useEffect(() => {
    fetch("/api/referral", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) setStats(j.data); });
  }, []);

  function fullReferralUrl() {
    if (typeof window === "undefined") return stats?.referralLink || "";
    const link = stats?.referralLink || "";
    if (link.startsWith("http://") || link.startsWith("https://")) return link;
    const origin = window.location.origin;
    if (link.startsWith("/")) return `${origin}${link}`;
    if (stats?.referralCode) return `${origin}/register?ref=${stats.referralCode}`;
    return `${origin}${link ? `/${link}` : ""}`;
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(t("Copied!", "কপি হয়েছে!")));
  }

  if (!stats) return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3"><AccountHeader title={t("Referral Center", "রেফারেল সেন্টার")} /><div className="flex h-48 items-center justify-center text-sm text-[#8ba0b3]">{t("Loading...", "লোড হচ্ছে...")}</div></div>;

  const rates = [
    { level: 1, bet: "2%", deposit: "3%", label: t("Direct", "সরাসরি") },
    { level: 2, bet: "1%", deposit: "1.5%", label: t("Level 2", "লেভেল ২") },
    { level: 3, bet: "0.5%", deposit: "—", label: t("Level 3", "লেভেল ৩") },
  ];

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-3">
        <AccountHeader title={t("Referral Center", "রেফারেল সেন্টার")} subtitle={t("Grow your team and earn commission", "টিম গড়ুন, কমিশন আয় করুন")} />
        <AccountHero username={t("Referral Program", "রেফারেল প্রোগ্রাম")} badge={t("3 levels", "৩ স্তর")} eyebrow={t("Invite and earn", "আমন্ত্রণ করুন, আয় করুন")} description={t("Earn commission from every bet your referrals make.", "রেফারেলের প্রতিটি বেট থেকে কমিশন আয় করুন।")}>
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/15 px-3 py-2"><div className="text-[10px] text-blue-50/70">{t("Your code", "আপনার কোড")}</div><div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-lg font-black">{stats.referralCode}</code><button type="button" onClick={() => copy(stats.referralCode)} className="rounded-lg bg-white/20 p-2" aria-label="Copy referral code"><Copy className="h-4 w-4" /></button></div></div><div className="rounded-xl bg-white/15 px-3 py-2"><div className="text-[10px] text-blue-50/70">{t("Total earned", "মোট আয়")}</div><div className="mt-1 text-lg font-black">৳ {stats.totalCommission.toFixed(0)}</div></div></div>
        </AccountHero>

        <div className="grid grid-cols-3 gap-2"><div className="rounded-xl border border-[#dce8f2] bg-[#fff9ec] p-3 text-center shadow-sm"><div className="text-xl font-black text-[#d4871b]">{stats.directReferrals.length}</div><div className="text-[10px] text-[#8b7a61]">{t("Referrals", "রেফারেল")}</div></div><div className="rounded-xl border border-[#dce8f2] bg-[#eef9f4] p-3 text-center shadow-sm"><div className="text-xl font-black text-[#2d9a72]">{stats.byLevel.reduce((s, l) => s + l.count, 0)}</div><div className="text-[10px] text-[#6c8f81]">{t("Total team", "মোট টিম")}</div></div><div className="rounded-xl border border-[#dce8f2] bg-[#f1f0ff] p-3 text-center shadow-sm"><div className="text-xl font-black text-[#6f68bb]">{stats.byLevel.length}</div><div className="text-[10px] text-[#7773a5]">{t("Levels", "লেভেল")}</div></div></div>

        <AccountCard title={t("Share link", "শেয়ার লিংক")} subtitle={t("Invite friends with one tap", "এক ট্যাপে বন্ধুদের আমন্ত্রণ করুন")} icon={<TrendingUp className="h-4 w-4" />}><div className="flex items-center gap-2 rounded-xl bg-[#f4f8fc] p-2.5"><div className="min-w-0 flex-1 break-all text-xs text-[#58728c]">{fullReferralUrl()}</div><button type="button" onClick={() => copy(fullReferralUrl())} className="shrink-0 rounded-lg bg-[#1f70c1] p-2 text-white" aria-label="Copy referral link"><Copy className="h-4 w-4" /></button></div></AccountCard>

        <AccountCard title={t("Commission rates", "কমিশন রেট")} icon={<Gift className="h-4 w-4" />}><div className="divide-y divide-[#e8f0f6]">{rates.map((r) => { const levelStats = stats.byLevel.find((b) => b.level === r.level); return <div key={r.level} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f2fb] text-xs font-black text-[#2675bd]">L{r.level}</div><div className="min-w-0 flex-1"><div className="text-sm font-black">{r.label}</div><div className="text-[10px] text-[#8499ac]">{t("Bet", "বেট")}: {r.bet} · {t("Deposit", "ডিপোজিট")}: {r.deposit}</div></div><div className="text-right"><div className="text-xs font-black text-[#d4871b]">+{levelStats?.earned?.toFixed(0) ?? 0} TK</div><div className="text-[10px] text-[#8ba0b3]">{levelStats?.count ?? 0} {t("members", "সদস্য")}</div></div></div>; })}</div></AccountCard>

        <AccountCard title={t("Direct referrals", "সরাসরি রেফারেল")} icon={<Users className="h-4 w-4" />}>{stats.directReferrals.length ? <div className="divide-y divide-[#e8f0f6]">{stats.directReferrals.map((u) => <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f2fb] text-xs font-black text-[#2675bd]">{u.username[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{u.username}</div><div className="text-[10px] text-[#8ba0b3]">{new Date(u.createdAt).toLocaleDateString()}</div></div><div className="text-right text-[11px] text-[#6e879d]"><div>Dep: {u.totalDeposit.toFixed(0)}</div><div>Bet: {u.totalBet.toFixed(0)}</div></div></div>)}</div> : <EmptyState icon={Users} title={t("No direct referrals yet", "এখনো কোনো সরাসরি রেফারেল নেই")} description={t("Share your code to grow your team.", "টিম বাড়াতে আপনার কোড শেয়ার করুন।")} />}</AccountCard>
      </div>
      <FloatingAccountActions />
    </div>
  );
}
