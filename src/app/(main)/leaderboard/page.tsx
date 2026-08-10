"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Trophy, Crown } from "lucide-react";

const VIP_NAMES = ["Bronze","Silver","Gold","Platinum","Diamond","Legend"];
const MEDAL = ["🥇","🥈","🥉"];

type Player = { rank: number; username: string; totalBet: number; totalWin: number; vipLevel: number };

export default function LeaderboardPage() {
  const t = useLang((s) => s.t);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<"bet"|"win">("bet");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${tab}`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setPlayers(j.data.players); })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <div className="text-center">
        <div className="text-3xl mb-1">🏆</div>
        <h1 className="text-2xl font-black text-amber-300">{t("Leaderboard","লিডারবোর্ড")}</h1>
        <p className="text-xs text-white/40">{t("Top players this month","এই মাসের সেরা খেলোয়াড়")}</p>
      </div>

      <div className="flex gap-2">
        {[["bet","Top Bettors","সেরা বেটার"],["win","Top Winners","সেরা বিজয়ী"]].map(([k,en,bn]) => (
          <button key={k} onClick={() => setTab(k as "bet"|"win")}
            className={cn("flex-1 rounded-xl py-2.5 text-xs font-bold transition",
              tab === k ? "bg-amber-400 text-emerald-950" : "bg-white/8 text-white hover:bg-white/15"
            )}>
            {t(en, bn)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/40">{t("Loading...","লোড হচ্ছে...")}</div>
      ) : (
        <div className="space-y-2">
          {players.map((p, idx) => (
            <div key={p.username}
              className={cn("flex items-center gap-3 rounded-2xl border p-3.5 transition",
                idx === 0 ? "border-amber-400/30 bg-amber-400/8" :
                idx === 1 ? "border-slate-400/20 bg-white/4" :
                idx === 2 ? "border-orange-600/20 bg-white/4" :
                "border-white/8 bg-white/3"
              )}>
              <div className="text-2xl w-8 text-center">{MEDAL[idx] ?? `#${p.rank}`}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white truncate">{p.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Crown className="h-3 w-3 text-purple-400" />
                  <span className="text-[10px] text-white/40">VIP {p.vipLevel} — {VIP_NAMES[p.vipLevel]}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-amber-300">
                  {formatCoins(tab === "bet" ? p.totalBet : p.totalWin)} TK
                </div>
                <div className="text-[10px] text-white/30">{t(tab === "bet" ? "total bet" : "total won", tab === "bet" ? "মোট বেট" : "মোট জয়")}</div>
              </div>
            </div>
          ))}
          {!players.length && (
            <div className="py-12 text-center text-white/40">{t("No data yet","এখনো ডেটা নেই")}</div>
          )}
        </div>
      )}
    </div>
  );
}
