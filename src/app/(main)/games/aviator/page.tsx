"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins, cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

/**
 * Aviator — embeds local game_aviator assets + bridges real TAKA69 balance
 * via postMessage + /api/aviator/bridge (crash engine).
 */
export default function AviatorPage() {
  const t = useLang((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const toast = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bal, setBal] = useState<number | null>(user?.balance ?? null);
  const [liveMult, setLiveMult] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("—");
  const [betting, setBetting] = useState(false);
  const [amount, setAmount] = useState(50);
  const [autoCash, setAutoCash] = useState(2);
  const [betId, setBetId] = useState<string | null>(null);

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/aviator/bridge", { credentials: "include" });
      const json = await res.json();
      if (!json.ok) return;
      if (typeof json.data.balance === "number") {
        setBal(json.data.balance);
        setBalance(json.data.balance);
      }
      const live = json.data.live;
      if (live) {
        setStatus(live.status || live.phase || "live");
        if (typeof live.multiplier === "number") setLiveMult(live.multiplier);
        else if (typeof live.currentMultiplier === "number") setLiveMult(live.currentMultiplier);
        // detect open bet
        const my = live.myBet || live.myBets?.[0];
        if (my?.id) setBetId(my.id);
        else if (live.status === "waiting" || live.phase === "waiting") setBetId(null);
      }
      // push balance into iframe if it listens
      try {
        iframeRef.current?.contentWindow?.postMessage(
          {
            source: "taka69",
            type: "BALANCE",
            balance: json.data.balance,
            currency: "BDT",
            symbol: "৳",
            username: json.data.username,
          },
          "*"
        );
      } catch {
        /* */
      }
    } catch {
      /* */
    }
  }, [setBalance]);

  useEffect(() => {
    sync();
    const id = setInterval(sync, 1500);
    return () => clearInterval(id);
  }, [sync]);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source === "taka69") return;
      // respond to balance requests from iframe
      if (d.type === "GET_BALANCE" || d.action === "getBalance") {
        iframeRef.current?.contentWindow?.postMessage(
          { source: "taka69", type: "BALANCE", balance: bal },
          "*"
        );
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [bal]);

  async function placeBet() {
    if (!user) {
      toast.error(t("Login required", "লগইন প্রয়োজন"));
      return;
    }
    setBetting(true);
    try {
      const res = await fetch("/api/aviator/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "bet",
          amount,
          autoCashout: autoCash > 1 ? autoCash : undefined,
          panel: 1,
        }),
      });
      const json = await res.json();
      if (!json.ok) toast.error(json.error || "Bet failed");
      else {
        toast.success(t("Bet placed", "বেট হয়েছে"), `${amount} BDT`);
        if (typeof json.data.balance === "number") {
          setBal(json.data.balance);
          setBalance(json.data.balance);
        }
        if (json.data.betId || json.data.bet?.id) setBetId(json.data.betId || json.data.bet.id);
      }
    } catch {
      toast.error("Network error");
    }
    setBetting(false);
    sync();
  }

  async function cashOut() {
    setBetting(true);
    try {
      const res = await fetch("/api/aviator/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cashout", betId: betId || undefined, panel: 1 }),
      });
      const json = await res.json();
      if (!json.ok) toast.error(json.error || "Cashout failed");
      else {
        toast.success(t("Cashed out!", "ক্যাশআউট!"), json.data.payout ? `+${json.data.payout} BDT` : "");
        if (typeof json.data.balance === "number") {
          setBal(json.data.balance);
          setBalance(json.data.balance);
        }
        setBetId(null);
      }
    } catch {
      toast.error("Network error");
    }
    setBetting(false);
    sync();
  }

  return (
    <div className="space-y-2 pb-4 -mx-1">
      <div className="flex items-center gap-2 px-1">
        <Link
          href="/games"
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black tracking-tight text-white">Aviator</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/70">
            {t("Crash · live flight", "ক্র্যাশ · লাইভ ফ্লাইট")}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-black/40 px-2.5 py-1 text-xs font-black text-amber-300">
          <Wallet className="h-3.5 w-3.5" />
          {bal === null ? "—" : `৳${formatCoins(bal)}`}
        </div>
        <button type="button" onClick={sync} className="rounded-full p-2 hover:bg-white/10" aria-label="refresh">
          <RefreshCw className="h-4 w-4 text-white/60" />
        </button>
        <Link
          href="/games/crash"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
        >
          {t("Classic", "ক্লাসিক")}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Live mult strip */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2 mx-1">
        <span className="text-[10px] uppercase tracking-widest text-white/40">{status}</span>
        <span
          className={cn(
            "text-2xl font-black tabular-nums",
            (liveMult ?? 1) >= 2 ? "text-emerald-400" : "text-amber-300"
          )}
        >
          {liveMult ? `${liveMult.toFixed(2)}x` : "1.00x"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)] mx-1">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-3 py-2">
          <span className="rounded-md bg-rose-500/90 px-2 py-0.5 text-[9px] font-black text-white">LIVE</span>
          <span className="text-[10px] font-semibold text-white/60">TAKA69 · Real balance</span>
        </div>
        <iframe
          ref={iframeRef}
          title="Aviator"
          src="/game_aviator/index.html"
          className="h-[48vh] min-h-[300px] w-full border-0 bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms"
          allow="autoplay; fullscreen"
        />
      </div>

      {/* Real-money controls under iframe */}
      <div className="mx-1 rounded-2xl border border-white/10 bg-emerald-950/60 p-3 space-y-2">
        <div className="text-[11px] font-bold text-emerald-200/70">
          {t("Play with wallet balance", "ওয়ালেট ব্যালেন্স দিয়ে খেলুন")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-white/50">
            {t("Bet amount", "বেট পরিমাণ")}
            <input
              type="number"
              value={amount}
              min={10}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-white outline-none"
            />
          </label>
          <label className="text-[10px] text-white/50">
            {t("Auto cashout", "অটো ক্যাশআউট")}
            <input
              type="number"
              value={autoCash}
              min={1.01}
              step={0.1}
              onChange={(e) => setAutoCash(Number(e.target.value) || 2)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-white outline-none"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={betting || !user}
            onClick={placeBet}
            className="flex-1 rounded-xl bg-gradient-to-b from-amber-300 to-yellow-500 py-3 text-sm font-black text-emerald-950 disabled:opacity-50"
          >
            {t("Bet", "বেট")}
          </button>
          <button
            type="button"
            disabled={betting || !user}
            onClick={cashOut}
            className="flex-1 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {t("Cash out", "ক্যাশআউট")}
          </button>
        </div>
        {!user && (
          <Link href="/login" className="block text-center text-xs font-bold text-amber-300">
            {t("Login to play with real balance", "রিয়েল ব্যালেন্স দিয়ে খেলতে লগইন করুন")}
          </Link>
        )}
      </div>

      <p className="text-center text-[10px] text-white/35 px-2">
        {t(
          "Provably fair crash · virtual BDT only · balance synced with wallet",
          "প্রুভেবলি ফেয়ার ক্র্যাশ · শুধু ভার্চুয়াল BDT · ব্যালেন্স ওয়ালেটের সাথে সিঙ্ক"
        )}
      </p>
    </div>
  );
}
