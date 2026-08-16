"use client";

import { useEffect, useState } from "react";
import { Crown, Gift, ShieldCheck, Star, Zap } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AccountCard, AccountHeader, AccountHero, EmptyState, FloatingAccountActions } from "@/components/account";

const VIP_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#b9f2ff", "#9b59b6"];
const VIP_ICONS = ["/icons/cat-hot.png", "/icons/cat-slots.png", "/icons/cat-live.png", "/icons/cat-crash.png", "/icons/logo.png", "/icons/icon-192.png"];

type Level = { id: number; nameEn: string; nameBn: string; minExp: number; dailyBonus: number; weeklyBonus: number; rebateRate: number; withdrawLimit: number };
type VipInfo = { vipLevel: number; vipExp: number; expProgress: number; currentLevel: Level; nextLevel: Level | null; canClaimDaily: boolean; levels: Level[] };

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
    const res = await fetch("/api/vip", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "claim_daily" }) });
    const json = await res.json();
    if (json.ok) {
      toast.success(t("Daily bonus claimed!", "ডেইলি বোনাস পেয়েছেন!"), `+${json.data.bonus} TK`);
      setInfo((i) => i ? { ...i, canClaimDaily: false } : i);
    } else toast.error(t("Failed", "ব্যর্থ"), json.error);
    setClaiming(false);
  }

  if (!info) return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3"><AccountHeader title={t("VIP Center", "ভিআইপি সেন্টার")} /><div className="flex h-48 items-center justify-center text-sm text-[#8ba0b3]">{t("Loading...", "লোড হচ্ছে...")}</div></div>;

  const { currentLevel, nextLevel, vipExp, expProgress, canClaimDaily, levels } = info;
  const vipColor = VIP_COLORS[info.vipLevel] ?? "#FFD700";

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-3">
        <AccountHeader title={t("VIP Center", "ভিআইপি সেন্টার")} subtitle={t("Unlock better rewards as you level up", "লেভেল বাড়লে আরও পুরস্কার আনলক করুন")} />
        <AccountHero username={user?.username || `VIP ${info.vipLevel}`} badge={`VIP ${info.vipLevel}`} eyebrow={t("Your membership", "আপনার মেম্বারশিপ")} description={lang === "bn" ? currentLevel.nameBn : currentLevel.nameEn} progress={nextLevel ? expProgress : 100} progressLabel={`${vipExp.toLocaleString()} EXP${nextLevel ? ` / ${nextLevel.minExp.toLocaleString()} EXP` : ""}`}>
          <div className="flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2"><img src={VIP_ICONS[info.vipLevel] || VIP_ICONS[0]} alt="" className="h-7 w-7 object-contain" /><div className="text-sm font-black">VIP {info.vipLevel} — {lang === "bn" ? currentLevel.nameBn : currentLevel.nameEn}</div><span className="ml-auto text-xs font-black" style={{ color: vipColor }}>{expProgress.toFixed(1)}%</span></div>
        </AccountHero>

        <AccountCard title={t("Daily bonus", "ডেইলি বোনাস")} subtitle={`+${currentLevel.dailyBonus} TK ${t("per day", "প্রতিদিন")}`} icon={<Gift className="h-4 w-4" />} action={<button type="button" onClick={claimDaily} disabled={!canClaimDaily || claiming || currentLevel.dailyBonus === 0} className={cn("rounded-lg px-4 py-2 text-xs font-black", canClaimDaily && currentLevel.dailyBonus > 0 ? "bg-[#f4b63e] text-[#173251]" : "bg-[#e7eef5] text-[#9aabba]")}>{claiming ? "..." : canClaimDaily ? t("Claim", "নিন") : t("Claimed", "নেওয়া হয়েছে")}</button>}>
          <div className="rounded-xl bg-[#fff8e8] p-3 text-xs text-[#8d7448]">{canClaimDaily ? t("Your daily VIP reward is ready to collect.", "আপনার দৈনিক VIP পুরস্কার নেওয়ার জন্য প্রস্তুত।") : t("Come back tomorrow for your next daily reward.", "পরবর্তী দৈনিক পুরস্কারের জন্য আগামীকাল ফিরে আসুন।")}</div>
        </AccountCard>

        <div className="grid grid-cols-3 gap-2">{[{ icon: <Zap className="h-4 w-4" />, label: t("Weekly bonus", "সাপ্তাহিক বোনাস"), value: `+${currentLevel.weeklyBonus} TK`, tone: "bg-[#fff4df] text-[#d4871b]" }, { icon: <Star className="h-4 w-4" />, label: t("Rebate rate", "রিবেট রেট"), value: `${currentLevel.rebateRate}%`, tone: "bg-[#eef9f4] text-[#2b946d]" }, { icon: <Crown className="h-4 w-4" />, label: t("Withdraw limit", "উইথড্র লিমিট"), value: `${(currentLevel.withdrawLimit / 1000).toFixed(0)}K`, tone: "bg-[#f1f0ff] text-[#6f68bb]" }].map((b) => <div key={b.label} className={`rounded-xl border border-[#dce8f2] p-3 shadow-sm ${b.tone}`}><div className="mb-1 flex items-center gap-1.5">{b.icon}<span className="text-[10px] font-bold opacity-75">{b.label}</span></div><div className="text-sm font-black">{b.value}</div></div>)}</div>

        <AccountCard title={t("All VIP levels", "সব ভিআইপি লেভেল")} subtitle={t("Compare benefits and progress", "সুবিধা ও অগ্রগতি তুলনা করুন")} icon={<ShieldCheck className="h-4 w-4" />}>
          <div className="space-y-2">{levels.length ? levels.map((lv) => { const isCurrentOrPast = lv.id <= info.vipLevel; const isCurrent = lv.id === info.vipLevel; return <div key={lv.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", isCurrent ? "border-[#91c2ea] bg-[#edf7ff]" : "border-[#e7eff5] bg-[#f8fbfe]")}><img src={VIP_ICONS[lv.id] || VIP_ICONS[0]} alt="" className="h-7 w-7 object-contain" /><div className="min-w-0 flex-1"><div className={cn("text-sm font-black", isCurrentOrPast ? "text-[#173251]" : "text-[#9aabba]")}>{lang === "bn" ? lv.nameBn : lv.nameEn}{isCurrent ? <span className="ml-2 rounded-full bg-[#1f70c1] px-1.5 py-0.5 text-[9px] text-white">{t("YOU", "আপনি")}</span> : null}</div><div className="text-[10px] text-[#8ba0b3]">{lv.minExp.toLocaleString()} EXP</div></div><div className="text-right"><div className={cn("text-xs font-black", isCurrentOrPast ? "text-[#d4871b]" : "text-[#aab8c3]")}>+{lv.dailyBonus} TK/d</div><div className="text-[10px] text-[#8ba0b3]">{lv.rebateRate}% rebate</div></div></div>; }) : <EmptyState icon={Crown} title={t("No VIP levels found", "কোনো VIP লেভেল পাওয়া যায়নি")} />}</div>
        </AccountCard>
      </div>
      <FloatingAccountActions />
    </div>
  );
}
