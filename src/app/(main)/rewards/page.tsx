"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatBdt } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  const initial =
    sp.get("tab") === "leaderboard" || sp.get("tab") === "lb" ? "lb" : "missions";
  const [tab, setTab] = useState(initial);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lbSort, setLbSort] = useState<"bet" | "win">("bet");
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
    fetch(`/api/leaderboard?sort=${lbSort}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        // support both shapes
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
      .catch(() => {});
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
    <div className="space-y-4 pb-8">
      <div className="flex gap-2">
        {(
          [
            ["missions", "Missions", "মিশন"],
            ["lb", "Leaderboard", "লিডারবোর্ড"],
            ["invite", "Invite", "আমন্ত্রণ"],
          ] as const
        ).map(([id, en, bn]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${
              tab === id ? "bg-amber-400 text-emerald-950" : "bg-emerald-950 text-white"
            }`}
          >
            {t(en, bn)}
          </button>
        ))}
      </div>

      {tab === "missions" && (
        <div className="space-y-3">
          {!user && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
              <Link href="/login">
                <Button>{t("Login", "লগইন")}</Button>
              </Link>
            </div>
          )}
          {missions.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-bold">{t(m.titleEn, m.titleBn)}</div>
                  <div className="text-xs text-emerald-200/60">
                    {t(m.descriptionEn, m.descriptionBn)}
                  </div>
                </div>
                <div className="text-amber-300 font-bold text-sm">+{formatBdt(m.reward)}</div>
              </div>
              <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, (m.progress / Math.max(1, m.target)) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>
                  {m.progress}/{m.target}
                </span>
                <Button size="sm" disabled={!m.completed || m.claimed} onClick={() => claim(m.id)}>
                  {m.claimed ? t("Claimed", "নেওয়া হয়েছে") : t("Claim", "নিন")}
                </Button>
              </div>
            </div>
          ))}
          {user && !missions.length && (
            <p className="text-center text-sm text-white/40 py-8">
              {t("No missions yet", "এখনো কোনো মিশন নেই")}
            </p>
          )}
        </div>
      )}

      {tab === "lb" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setLbSort("bet")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                lbSort === "bet" ? "bg-amber-400 text-emerald-950" : "bg-white/10"
              }`}
            >
              {t("Top bettors", "সেরা বেটার")}
            </button>
            <button
              onClick={() => setLbSort("win")}
              className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                lbSort === "win" ? "bg-amber-400 text-emerald-950" : "bg-white/10"
              }`}
            >
              {t("Top winners", "সেরা বিজয়ী")}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-1">
            {players.map((u, i) => (
              <div
                key={u.username + i}
                className="flex justify-between py-2 text-sm border-b border-emerald-900/40 last:border-0"
              >
                <span>
                  #{u.rank ?? i + 1} {u.username}
                </span>
                <span className="text-amber-300 font-semibold">
                  {formatBdt(lbSort === "win" ? u.totalWin ?? 0 : u.totalBet ?? u.balance ?? 0)}
                </span>
              </div>
            ))}
            {!players.length && (
              <p className="py-6 text-center text-xs text-white/40">
                {t("No rankings yet", "এখনো র‌্যাঙ্কিং নেই")}
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "invite" && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3 text-center">
          <h3 className="font-bold text-lg">{t("Invite friends", "বন্ধুদের আমন্ত্রণ")}</h3>
          <p className="text-sm text-emerald-100/70">
            {t("Share your code and earn commission.", "কোড শেয়ার করুন এবং কমিশন আয় করুন।")}
          </p>
          {user ? (
            <>
              <div className="rounded-xl bg-black/30 border border-amber-500/30 py-4 text-2xl font-black tracking-widest text-amber-300">
                {refCode || user.username}
              </div>
              <Link href="/referral" className="text-xs font-bold text-amber-300 underline">
                {t("Open referral center", "রেফারেল সেন্টার খুলুন")}
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button>{t("Login", "লগইন")}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-emerald-200/60">Loading…</div>}>
      <RewardsInner />
    </Suspense>
  );
}
