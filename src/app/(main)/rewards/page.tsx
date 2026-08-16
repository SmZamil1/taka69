"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gift, Medal, Target, Trophy, Users } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatBdt } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  AccountCard,
  AccountHeader,
  AccountHero,
  AccountTabs,
  EmptyState,
  FloatingAccountActions,
} from "@/components/account";

type Mission = {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  target: number;
  reward: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

type Player = {
  rank?: number;
  username: string;
  totalBet?: number;
  totalWin?: number;
  balance?: number;
  totalWon?: number;
  vipLevel?: number;
};

function RewardsInner() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const sp = useSearchParams();
  const initial: "missions" | "lb" = sp.get("tab") === "leaderboard" || sp.get("tab") === "lb" ? "lb" : "missions";
  const [tab, setTab] = useState<"missions" | "lb" | "invite">(initial);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lbSort, setLbSort] = useState<"bet" | "win">("bet");
  const [lbLoading, setLbLoading] = useState(true);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    if (user) {
      fetch("/api/missions", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => j.ok && setMissions(j.data.missions || []));
      fetch("/api/profile", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) setRefCode(j.data.referralCode || user.username || "");
        })
        .catch(() => setRefCode(user.username || ""));
    }
  }, [user]);

  useEffect(() => {
    setLbLoading(true);
    fetch(`/api/leaderboard?sort=${lbSort}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        if (Array.isArray(j.data?.players)) setPlayers(j.data.players);
        else if (Array.isArray(j.data?.topBalance)) {
          setPlayers(
            (lbSort === "win" ? j.data.topWinners : j.data.topBalance).map(
              (u: Player, i: number) => ({
                rank: i + 1,
                username: u.username,
                totalBet: u.totalBet ?? u.balance ?? 0,
                totalWin: u.totalWin ?? u.totalWon ?? 0,
              })
            )
          );
        }
      })
      .catch(() => {})
      .finally(() => setLbLoading(false));
  }, [lbSort]);

  async function claim(id: string) {
    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ missionId: id }),
    });
    const json = await res.json();
    if (json.ok) {
      setBalance(json.data.balance);
      setMissions((ms) => ms.map((m) => (m.id === id ? { ...m, claimed: true } : m)));
    }
  }

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-24 pt-3 text-[#173251]">
      <div className="mx-auto max-w-lg space-y-3">
        <AccountHeader title={t("Reward Center", "পুরস্কার কেন্দ্র")} subtitle={t("Missions, rankings and invites", "মিশন, র‍্যাঙ্কিং ও আমন্ত্রণ")} />
        <AccountHero
          username={user?.username || t("Reward Center", "পুরস্কার কেন্দ্র")}
          balance={user?.balance}
          badge={t("Rewards", "পুরস্কার")}
          eyebrow={t("Play more, earn more", "খেলুন, অর্জন করুন")}
          description={t("Complete missions and collect virtual TK rewards.", "মিশন শেষ করে ভার্চুয়াল TK পুরস্কার সংগ্রহ করুন।")}
        />

        <AccountTabs
          value={tab}
          onChange={(value) => setTab(value as "missions" | "lb" | "invite")}
          tabs={[
            { id: "missions", label: t("Missions", "মিশন"), count: missions.length || undefined },
            { id: "lb", label: t("Leaderboard", "লিডারবোর্ড") },
            { id: "invite", label: t("Invite", "আমন্ত্রণ") },
          ]}
        />

        {tab === "missions" && (
          <AccountCard title={t("Daily missions", "দৈনিক মিশন")} subtitle={t("Finish a task to unlock its reward", "টাস্ক শেষ করে পুরস্কার আনলক করুন")} icon={<Target className="h-4 w-4" />}>
            <div className="space-y-3">
              {!user && (
                <EmptyState
                  icon={Trophy}
                  title={t("Login to see your missions", "আপনার মিশন দেখতে লগইন করুন")}
                  action={<Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>}
                />
              )}
              {user && missions.map((m) => {
                const progress = Math.min(100, (m.progress / Math.max(1, m.target)) * 100);
                return (
                  <div key={m.id} className="rounded-xl border border-[#e0ebf4] bg-[#f8fbfe] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black text-[#173251]">{t(m.titleEn, m.titleBn)}</div>
                        <div className="mt-0.5 text-[11px] text-[#7b93aa]">{t(m.descriptionEn, m.descriptionBn)}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-[#fff0d7] px-2 py-1 text-xs font-black text-[#d47b16]">+{formatBdt(m.reward)}</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dbe8f3]"><div className="h-full rounded-full bg-gradient-to-r from-[#2675bd] to-[#53a8e7]" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#7690a8]">
                      <span>{m.progress}/{m.target} {t("completed", "সম্পন্ন")}</span>
                      <Button size="sm" disabled={!m.completed || m.claimed} onClick={() => claim(m.id)}>{m.claimed ? t("Claimed", "নেওয়া হয়েছে") : t("Claim", "নিন")}</Button>
                    </div>
                  </div>
                );
              })}
              {user && !missions.length && <EmptyState icon={Target} title={t("No missions yet", "এখনো কোনো মিশন নেই")} description={t("New missions will appear here soon.", "নতুন মিশন শিগগিরই এখানে দেখা যাবে।")} />}
            </div>
          </AccountCard>
        )}

        {tab === "lb" && (
          <AccountCard title={t("Leaderboard", "লিডারবোর্ড")} subtitle={t("See who is leading today", "আজ কে এগিয়ে দেখুন")} icon={<Medal className="h-4 w-4" />}>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setLbSort("bet")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-black ${lbSort === "bet" ? "bg-[#1f70c1] text-white" : "bg-[#eaf2f9] text-[#6a849d]"}`}>{t("Top bettors", "সেরা বেটার")}</button>
              <button type="button" onClick={() => setLbSort("win")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-black ${lbSort === "win" ? "bg-[#1f70c1] text-white" : "bg-[#eaf2f9] text-[#6a849d]"}`}>{t("Top winners", "সেরা বিজয়ী")}</button>
            </div>
            {lbLoading ? <div className="py-8 text-center text-sm text-[#8ba0b3]">{t("Loading...", "লোড হচ্ছে...")}</div> : players.length ? <div className="space-y-2">{players.map((u, i) => <div key={u.username + i} className="flex items-center gap-3 rounded-xl border border-[#e2edf5] bg-[#f8fbfe] px-3 py-2.5"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${i === 0 ? "bg-[#fff0bd] text-[#b57900]" : i === 1 ? "bg-[#edf1f5] text-[#6e8192]" : i === 2 ? "bg-[#f9e3d6] text-[#a96b43]" : "bg-[#e8f2fb] text-[#3978ad]"}`}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${u.rank ?? i + 1}`}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{u.username}</div><div className="text-[10px] text-[#8ba0b3]">VIP{u.vipLevel ?? 0}</div></div><div className="text-right"><div className="text-sm font-black text-[#1f70c1]">{formatBdt(lbSort === "win" ? u.totalWin ?? 0 : u.totalBet ?? u.balance ?? 0)}</div><div className="text-[9px] text-[#8ba0b3]">{lbSort === "win" ? t("Won", "জয়") : t("Bet", "বেট")}</div></div></div>)}</div> : <EmptyState icon={Medal} title={t("No rankings yet", "এখনো র‍্যাঙ্কিং নেই")} />}
          </AccountCard>
        )}

        {tab === "invite" && (
          <AccountCard title={t("Invite friends", "বন্ধুদের আমন্ত্রণ")} subtitle={t("Share your code and earn commission.", "কোড শেয়ার করুন এবং কমিশন আয় করুন।")} icon={<Users className="h-4 w-4" />}>
            {user ? <div className="space-y-3 text-center"><div className="rounded-xl bg-gradient-to-r from-[#eaf4ff] to-[#f3f8fc] px-3 py-4 text-2xl font-black tracking-[0.18em] text-[#1f70c1]">{refCode || user.username}</div><div className="flex items-center justify-center gap-2 text-[11px] text-[#7b93aa]"><Gift className="h-4 w-4 text-[#e5942b]" /> {t("Your referral code is ready", "আপনার রেফারেল কোড প্রস্তুত")}</div><Link href="/referral" className="text-xs font-black text-[#1f70c1] underline">{t("Open referral center", "রেফারেল সেন্টার খুলুন")}</Link></div> : <EmptyState icon={Users} title={t("Login to invite friends", "বন্ধুদের আমন্ত্রণ জানাতে লগইন করুন")} action={<Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>} />}
          </AccountCard>
        )}
      </div>
      <FloatingAccountActions />
    </div>
  );
}

export default function RewardsPage() {
  return <Suspense fallback={<div className="min-h-48 bg-[#eef5fb] p-6 text-center text-sm text-[#7891a8]">Loading…</div>}><RewardsInner /></Suspense>;
}
