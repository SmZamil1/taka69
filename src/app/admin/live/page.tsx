"use client";

import { useEffect, useState } from "react";
import { formatCoins } from "@/lib/utils";
import { Activity, RefreshCw } from "lucide-react";

type Visitor = {
  userId: string;
  username: string;
  role: string;
  balance: number;
  path: string;
  lastSeen: string;
};

export default function AdminLivePage() {
  const [online, setOnline] = useState(0);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [pendingD, setPendingD] = useState(0);
  const [pendingW, setPendingW] = useState(0);
  const [support, setSupport] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/live", { credentials: "include" });
        const j = await res.json();
        if (!dead && j.ok) {
          setOnline(j.data.online || 0);
          setVisitors(j.data.visitors || []);
          setPendingD(j.data.pendingDeposits || 0);
          setPendingW(j.data.pendingWithdraws || 0);
          setSupport(j.data.openSupportThreads || 0);
          setTick((t) => t + 1);
        }
      } catch {
        /* */
      }
    }
    load();
    const id = window.setInterval(load, 1000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-amber-300">Live visitors</h1>
          <p className="text-xs text-white/40">Updates every second · heartbeat window 45s</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-black text-emerald-300">
          <Activity className="h-4 w-4" />
          {online} online
          <RefreshCw className="h-3.5 w-3.5 animate-spin opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Online now", online, "text-emerald-300"],
          ["Pending deposits", pendingD, "text-amber-300"],
          ["Pending withdraws", pendingW, "text-orange-300"],
          ["Open support", support, "text-sky-300"],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] text-white/45">{l}</div>
            <div className={`mt-1 text-2xl font-black ${c}`}>{v as number}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-bold">Active pages</div>
          <div className="text-[10px] text-white/35">tick #{tick}</div>
        </div>
        <div className="divide-y divide-white/5">
          {visitors.map((v) => (
            <div key={v.userId + v.path} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-300">
                {v.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-white">
                  {v.username}{" "}
                  <span className="text-[10px] font-semibold text-white/35">{v.role}</span>
                </div>
                <div className="truncate text-[11px] text-emerald-200/50">{v.path}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-300">৳{formatCoins(v.balance)}</div>
                <div className="text-[10px] text-white/30">
                  {new Date(v.lastSeen).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {!visitors.length && (
            <div className="px-4 py-10 text-center text-sm text-white/40">No active visitors right now</div>
          )}
        </div>
      </div>
    </div>
  );
}
