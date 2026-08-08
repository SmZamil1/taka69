"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
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

export default function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const sp = useSearchParams();
  const [tab, setTab] = useState(sp.get("tab") === "leaderboard" ? "lb" : "missions");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [lb, setLb] = useState<{
    topBalance: { username: string; balance: number }[];
    topWinners: { username: string; totalWon: number }[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/missions", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => j.ok && setMissions(j.data.missions));
    }
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((j) => j.ok && setLb(j.data));
  }, [user]);

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
      setMissions((ms) =>
        ms.map((m) => (m.id === id ? { ...m, claimed: true } : m))
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("missions")}
          className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "missions" ? "bg-gold-500 text-emerald-950" : "bg-emerald-950"}`}
        >
          {t("Missions", "মিশন")}
        </button>
        <button
          onClick={() => setTab("lb")}
          className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "lb" ? "bg-gold-500 text-emerald-950" : "bg-emerald-950"}`}
        >
          {t("Leaderboard", "লিডারবোর্ড")}
        </button>
        <button
          onClick={() => setTab("invite")}
          className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === "invite" ? "bg-gold-500 text-emerald-950" : "bg-emerald-950"}`}
        >
          {t("Invite", "আমন্ত্রণ")}
        </button>
      </div>

      {tab === "missions" && (
        <div className="space-y-3">
          {!user && (
            <div className="card text-center">
              <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
            </div>
          )}
          {missions.map((m) => (
            <div key={m.id} className="card space-y-2">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-bold">{t(m.titleEn, m.titleBn)}</div>
                  <div className="text-xs text-emerald-200/60">
                    {t(m.descriptionEn, m.descriptionBn)}
                  </div>
                </div>
                <div className="text-gold-300 font-bold text-sm">+{m.reward}</div>
              </div>
              <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>
                  {m.progress}/{m.target}
                </span>
                <Button
                  size="sm"
                  disabled={!m.completed || m.claimed}
                  onClick={() => claim(m.id)}
                >
                  {m.claimed
                    ? t("Claimed", "নেওয়া হয়েছে")
                    : t("Claim", "নিন")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "lb" && lb && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold mb-2">{t("Top balances", "টপ ব্যালেন্স")}</h3>
            {lb.topBalance.map((u, i) => (
              <div key={u.username} className="flex justify-between py-1.5 text-sm border-b border-emerald-900/50">
                <span>
                  #{i + 1} {u.username}
                </span>
                <span className="text-gold-300 font-semibold">{formatCoins(u.balance)}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-bold mb-2">{t("Top winners", "টপ উইনার")}</h3>
            {lb.topWinners.map((u, i) => (
              <div key={u.username + i} className="flex justify-between py-1.5 text-sm border-b border-emerald-900/50">
                <span>
                  #{i + 1} {u.username}
                </span>
                <span className="text-emerald-400 font-semibold">{formatCoins(u.totalWon)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "invite" && (
        <div className="card space-y-3 text-center">
          <h3 className="font-bold text-lg">{t("Invite friends", "বন্ধুদের আমন্ত্রণ")}</h3>
          <p className="text-sm text-emerald-100/70">
            {t("Share your code — earn 500 TK per signup.", "কোড শেয়ার করুন — প্রতি সাইনআপে ৫০০ টিসি।")}
          </p>
          {user ? (
            <div className="rounded-xl bg-black/30 border border-gold-500/30 py-4 text-2xl font-black tracking-widest text-gold-300">
              {user.referralCode}
            </div>
          ) : (
            <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
          )}
        </div>
      )}
    </div>
  );
}
