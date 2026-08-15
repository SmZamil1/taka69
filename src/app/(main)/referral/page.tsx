"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { Copy, Users, TrendingUp, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type RefStats = {
  referralCode: string; referralLink: string; totalCommission: number;
  directReferrals: Array<{ id: string; username: string; createdAt: string; totalDeposit: number; totalBet: number }>;
  byLevel: Array<{ level: number; count: number; earned: number }>;
};

export default function ReferralPage() {
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
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
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t("Copied!", "কপি হয়েছে!"));
    });
  }

  if (!stats) return (
    <div className="flex h-48 items-center justify-center text-white/30 text-sm">
      {t("Loading...", "লোড হচ্ছে...")}
    </div>
  );

  const RATES = [
    { level: 1, bet: "2%", deposit: "3%", label: t("Direct", "সরাসরি") },
    { level: 2, bet: "1%", deposit: "1.5%", label: t("Level 2", "লেভেল ২") },
    { level: 3, bet: "0.5%", deposit: "—", label: t("Level 3", "লেভেল ৩") },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      {/* ── Hero ── */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 border border-emerald-700/30">
        <div className="text-2xl font-black text-white mb-1">{t("Referral Program", "রেফারেল প্রোগ্রাম")}</div>
        <div className="text-sm text-emerald-300/70">
          {t("Earn commission from every bet your referrals make — 3 levels deep", "৩ লেভেল পর্যন্ত রেফারেলের প্রতিটি বেট থেকে কমিশন আয় করুন")}
        </div>

        <div className="mt-4 rounded-2xl bg-black/30 p-3">
          <div className="text-[10px] text-emerald-300/60 uppercase tracking-wider mb-1">{t("Your Code", "আপনার কোড")}</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-lg font-black text-amber-300">{stats.referralCode}</code>
            <button onClick={() => copy(stats.referralCode)} className="rounded-lg bg-white/10 p-2 hover:bg-white/15">
              <Copy className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="mt-2 rounded-2xl bg-black/30 p-3">
          <div className="text-[10px] text-emerald-300/60 uppercase tracking-wider mb-1">{t("Share Link", "শেয়ার লিংক")}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 break-all text-xs text-white/70">{fullReferralUrl()}</div>
            <button onClick={() => copy(fullReferralUrl())} className="rounded-lg bg-white/10 p-2 hover:bg-white/15 shrink-0">
              <Copy className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
          <div className="text-xl font-black text-white">{stats.directReferrals.length}</div>
          <div className="text-[10px] text-white/40">{t("Referrals", "রেফারেল")}</div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
          <div className="text-xl font-black text-amber-300">{stats.totalCommission.toFixed(0)}</div>
          <div className="text-[10px] text-white/40">{t("Total TK Earned", "মোট আয়")}</div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
          <div className="text-xl font-black text-emerald-300">{stats.byLevel.reduce((s,l)=>s+l.count,0)}</div>
          <div className="text-[10px] text-white/40">{t("Total Team", "মোট টিম")}</div>
        </div>
      </div>

      {/* ── Commission rates ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-black text-white text-sm">{t("Commission Rates", "কমিশন রেট")}</h2>
        </div>
        <div className="divide-y divide-white/5">
          {RATES.map((r, i) => {
            const lvlStats = stats.byLevel.find((b) => b.level === r.level);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-300">
                  L{r.level}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{r.label}</div>
                  <div className="text-[10px] text-white/40">
                    {t("Bet", "বেট")}: {r.bet} · {t("Deposit", "ডিপোজিট")}: {r.deposit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-300">+{lvlStats?.earned?.toFixed(0) ?? 0} TK</div>
                  <div className="text-[10px] text-white/30">{lvlStats?.count ?? 0} {t("members", "সদস্য")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Team list ── */}
      {stats.directReferrals.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-surface-900 overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="font-black text-white text-sm">{t("Direct Referrals", "সরাসরি রেফারেল")}</h2>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {stats.directReferrals.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-300">
                  {u.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{u.username}</div>
                  <div className="text-[10px] text-white/30">{new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right text-[11px] text-white/50">
                  <div>Dep: {u.totalDeposit.toFixed(0)}</div>
                  <div>Bet: {u.totalBet.toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
