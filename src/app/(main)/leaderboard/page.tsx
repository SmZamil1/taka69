"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { formatBdt, cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

type Player = {
  rank: number;
  username: string;
  totalBet: number;
  totalWin: number;
  vipLevel: number;
};

export default function LeaderboardPage() {
  const t = useLang((s) => s.t);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<"bet" | "win">("bet");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${tab}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && Array.isArray(j.data?.players)) setPlayers(j.data.players);
        else setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-amber-300 mb-1" />
        <h1 className="text-2xl font-black text-amber-300">
          {t("Leaderboard", "লিডারবোর্ড")}
        </h1>
        <p className="text-xs text-white/40">
          {t("Top players", "সেরা খেলোয়াড়")}
        </p>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["bet", "Top Bettors", "সেরা বেটার"],
            ["win", "Top Winners", "সেরা বিজয়ী"],
          ] as const
        ).map(([k, en, bn]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-xs font-bold transition",
              tab === k ? "bg-amber-400 text-emerald-950" : "bg-white/8 text-white hover:bg-white/15"
            )}
          >
            {t(en, bn)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/40">{t("Loading...", "লোড হচ্ছে...")}</div>
      ) : (
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div
              key={p.username}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3.5",
                idx === 0
                  ? "border-amber-400/30 bg-amber-400/8"
                  : "border-white/8 bg-white/3"
              )}
            >
              <div className="text-2xl w-8 text-center">{MEDAL[idx] ?? `#${p.rank}`}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{p.username}</div>
                <div className="text-[10px] text-white/40">VIP{p.vipLevel ?? 0}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-300">
                  {formatBdt(tab === "win" ? p.totalWin : p.totalBet)}
                </div>
                <div className="text-[9px] text-white/40">
                  {tab === "win" ? t("Won", "জয়") : t("Bet", "বেট")}
                </div>
              </div>
            </div>
          ))}
          {!players.length && (
            <p className="py-10 text-center text-sm text-white/40">
              {t("No players yet", "এখনো কোনো খেলোয়াড় নেই")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
