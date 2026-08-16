"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Crown, Gift, Zap, Star, ChevronRight } from "lucide-react";

const VIP_COLORS = ["#CD7F32","#C0C0C0","#FFD700","#E5E4E2","#b9f2ff","#9b59b6"];
const VIP_ICONS = ["/icons/cat-hot.png","/icons/cat-slots.png","/icons/cat-live.png","/icons/cat-crash.png","/icons/logo.png","/icons/icon-192.png"];

type Level = {
  id: number; nameEn: string; nameBn: string;
  minExp: number; dailyBonus: number; weeklyBonus: number;
  rebateRate: number; withdrawLimit: number;
};

type VipInfo = {
  vipLevel: number; vipExp: number; expProgress: number;
  currentLevel: Level; nextLevel: Level | null;
  canClaimDaily: boolean; levels: Level[];
};

export default function VipPage() {
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [info, setInfo] = useState<VipInfo | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetch("/api/vip", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) setInfo(j.data); });
  }, []);

  async function claimDaily() {
    setClaiming(true);
    const res = await fetch("/api/vip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "claim_daily" }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(t("Daily bonus claimed!", "ডেইলি বোনাস পেয়েছেন!"), `+${json.data.bonus} TK`);
      setInfo((i) => i ? { ...i, canClaimDaily: false } : i);
    } else {
      toast.error(t("Failed", "ব্যর্থ"), json.error);
    }
    setClaiming(false);
  }

  if (!info) return (
    <div className="flex h-48 items-center justify-center text-white/30 text-sm">
      {t("Loading...", "লোড হচ্ছে...")}
    </div>
  );

  const { currentLevel, nextLevel, vipExp, expProgress, canClaimDaily, levels } = info;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      {/* ── VIP Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: `linear-gradient(135deg, ${VIP_COLORS[info.vipLevel] ?? "#FFD700"}33, rgba(0,0,0,0.8))`,
                 border: `1px solid ${VIP_COLORS[info.vipLevel] ?? "#FFD700"}55` }}
      >
        <div className="absolute right-4 top-4 text-5xl opacity-20"><img src={VIP_ICONS[info.vipLevel] || VIP_ICONS[0]} alt="" className="h-8 w-8 object-contain" /></div>
        <div className="text-3xl mb-1"><img src={VIP_ICONS[info.vipLevel] || VIP_ICONS[0]} alt="" className="h-8 w-8 object-contain" /></div>
        <div className="text-2xl font-black text-white">
          VIP {info.vipLevel} — {lang === "bn" ? currentLevel.nameBn : currentLevel.nameEn}
        </div>
        <div className="mt-1 text-sm text-white/60">
          {vipExp.toLocaleString()} EXP
          {nextLevel && <span> / {nextLevel.minExp.toLocaleString()} EXP</span>}
        </div>

        {/* Progress bar */}
        {nextLevel && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${expProgress}%`, background: VIP_COLORS[info.vipLevel] }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>{expProgress.toFixed(1)}%</span>
              <span>{t("Next", "পরবর্তী")}: {lang === "bn" ? nextLevel.nameBn : nextLevel.nameEn}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Daily Bonus Claim ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-400" />
              {t("Daily Bonus", "ডেইলি বোনাস")}
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              +{currentLevel.dailyBonus} TK {t("per day", "প্রতিদিন")}
            </div>
          </div>
          <button
            onClick={claimDaily}
            disabled={!canClaimDaily || claiming || currentLevel.dailyBonus === 0}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black transition",
              canClaimDaily && currentLevel.dailyBonus > 0
                ? "bg-amber-400 text-emerald-950 hover:opacity-90"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
          >
            {claiming ? "..." : canClaimDaily ? t("Claim", "নিন") : t("Claimed", "নেওয়া হয়েছে")}
          </button>
        </div>
      </div>

      {/* ── Benefits grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Zap className="h-4 w-4 text-amber-400" />, label: t("Weekly Bonus", "সাপ্তাহিক বোনাস"), value: `+${currentLevel.weeklyBonus} TK` },
          { icon: <Star className="h-4 w-4 text-blue-400" />, label: t("Rebate Rate", "রিবেট রেট"), value: `${currentLevel.rebateRate}%` },
          { icon: <Crown className="h-4 w-4 text-purple-400" />, label: t("Withdraw Limit", "উইথড্র লিমিট"), value: `${(currentLevel.withdrawLimit/1000).toFixed(0)}K TK` },
        ].map((b, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3">
            <div className="flex items-center gap-2 mb-1">{b.icon}<span className="text-[11px] text-white/50">{b.label}</span></div>
            <div className="font-black text-white">{b.value}</div>
          </div>
        ))}
      </div>

      {/* ── VIP Level Table ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="font-black text-white text-sm">{t("All VIP Levels", "সব ভিআইপি লেভেল")}</h2>
        </div>
        <div className="divide-y divide-white/5">
          {levels.map((lv) => {
            const isCurrentOrPast = lv.id <= info.vipLevel;
            const isCurrent = lv.id === info.vipLevel;
            return (
              <div
                key={lv.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition",
                  isCurrent ? "bg-white/8" : ""
                )}
              >
                <span className="text-xl"><img src={VIP_ICONS[lv.id] || VIP_ICONS[0]} alt="" className="h-6 w-6 object-contain" /></span>
                <div className="flex-1 min-w-0">
                  <div className={cn("font-bold text-sm", isCurrentOrPast ? "text-white" : "text-white/40")}>
                    {lang === "bn" ? lv.nameBn : lv.nameEn}
                    {isCurrent && <span className="ml-2 text-[9px] rounded-full bg-amber-400 text-emerald-950 px-1.5 py-0.5 font-black">YOU</span>}
                  </div>
                  <div className="text-[10px] text-white/30">{lv.minExp.toLocaleString()} EXP</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-xs font-bold", isCurrentOrPast ? "text-amber-300" : "text-white/30")}>
                    +{lv.dailyBonus} TK/d
                  </div>
                  <div className="text-[10px] text-white/30">{lv.rebateRate}% rebate</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
