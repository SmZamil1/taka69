"use client";

import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { formatBdt, cn } from "@/lib/utils";
import { AccountCard, AccountHeader, AccountHero, AccountTabs, EmptyState, FloatingAccountActions } from "@/components/account";

const MEDAL = ["🥇", "🥈", "🥉"];

type Player = { rank: number; username: string; totalBet: number; totalWin: number; vipLevel: number };

export default function LeaderboardPage() {
  const t = useLang((s) => s.t);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<"bet" | "win">("bet");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${tab}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok && Array.isArray(j.data?.players)) setPlayers(j.data.players); else setPlayers([]); })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-3">
        <AccountHeader title={t("Leaderboard", "লিডারবোর্ড")} subtitle={t("Top players and biggest wins", "সেরা খেলোয়াড় ও বড় জয়")} />
        <AccountHero username={t("Top players", "সেরা খেলোয়াড়")} badge={t("Rankings", "র‍্যাঙ্কিং")} eyebrow={t("Compete and shine", "প্রতিযোগিতা করুন")} description={t("See who is leading the virtual TK tables.", "ভার্চুয়াল TK টেবিলে কে এগিয়ে দেখুন।")}><div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-black"><Trophy className="h-5 w-5 text-[#ffe3a0]" /> {t("Your next win could be here", "পরের জয়টি আপনার হতে পারে")}</div></AccountHero>
        <AccountTabs value={tab} onChange={(value) => setTab(value as "bet" | "win")} tabs={[{ id: "bet", label: t("Top bettors", "সেরা বেটার") }, { id: "win", label: t("Top winners", "সেরা বিজয়ী") }]} />
        <AccountCard title={tab === "win" ? t("Top winners", "সেরা বিজয়ী") : t("Top bettors", "সেরা বেটার")} subtitle={t("Updated from the live leaderboard", "লাইভ লিডারবোর্ড থেকে আপডেট করা হয়েছে")} icon={<Medal className="h-4 w-4" />}>
          {loading ? <div className="py-12 text-center text-sm text-[#8ba0b3]">{t("Loading...", "লোড হচ্ছে...")}</div> : players.length ? <div className="space-y-2">{players.map((p, idx) => <div key={p.username} className={cn("flex items-center gap-3 rounded-xl border px-3 py-3", idx === 0 ? "border-[#f2d28a] bg-[#fffaf0]" : "border-[#e2edf5] bg-[#f8fbfe]")}><div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-lg", idx === 0 ? "bg-[#fff0bd]" : idx === 1 ? "bg-[#edf1f5]" : idx === 2 ? "bg-[#f9e3d6]" : "bg-[#e8f2fb]")}>{MEDAL[idx] ?? `#${p.rank}`}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{p.username}</div><div className="text-[10px] text-[#8ba0b3]">VIP{p.vipLevel ?? 0} · #{p.rank}</div></div><div className="text-right"><div className="text-sm font-black text-[#1f70c1]">{formatBdt(tab === "win" ? p.totalWin : p.totalBet)}</div><div className="text-[9px] text-[#8ba0b3]">{tab === "win" ? t("Won", "জয়") : t("Bet", "বেট")}</div></div></div>)}</div> : <EmptyState icon={Medal} title={t("No players yet", "এখনো কোনো খেলোয়াড় নেই")} description={t("Rankings will appear as players join in.", "খেলোয়াড়রা যোগ দিলে র‍্যাঙ্কিং এখানে দেখা যাবে।")} />}
        </AccountCard>
      </div>
      <FloatingAccountActions />
    </div>
  );
}
