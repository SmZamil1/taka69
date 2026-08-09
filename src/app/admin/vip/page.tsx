"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Crown } from "lucide-react";

const VIP_NAMES = ["Bronze","Silver","Gold","Platinum","Diamond","Legend"];

type VipStats = {
  level: number; count: number; totalBalance: number; totalBet: number;
};

export default function AdminVipPage() {
  const [stats, setStats] = useState<VipStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/vip", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setStats(j.data.stats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-amber-300">VIP Overview</h1>

      {loading ? (
        <div className="py-12 text-center text-white/40">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {VIP_NAMES.map((name, lvl) => {
            const s = stats.find(x => x.level === lvl);
            return (
              <div key={lvl} className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-white">VIP {lvl} — {name}</span>
                </div>
                <div className="text-2xl font-black text-amber-300">{s?.count ?? 0}</div>
                <div className="text-[11px] text-white/40 mt-1">users</div>
                <div className="mt-2 text-[11px] text-white/50">
                  Balance: {formatCoins(s?.totalBalance ?? 0)} TK
                </div>
                <div className="text-[11px] text-white/50">
                  Bet Vol: {formatCoins(s?.totalBet ?? 0)} TK
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
