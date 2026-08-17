"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";

type Request = { id: string; type: string; method: string; channel?: string | null; amount: number; grossAmount?: number | null; feeAmount?: number; netAmount?: number | null; status: string; trxId?: string | null; providerRef?: string | null; bonusAmount?: number; adminNote?: string | null; rejectionReason?: string | null; processedAt?: string | null; createdAt: string };
type Tx = { id: string; type: string; amount: number; grossAmount?: number | null; feeAmount?: number; netAmount?: number | null; method?: string | null; reference?: string | null; status?: string | null; note?: string | null; createdAt: string };
type Bet = { id: string; gameType: string; amount: number; payout: number; won: boolean; createdAt: string };

function WalletRecordsContent() {
  const t = useLang((s) => s.t);
  const sp = useSearchParams();
  const [view, setView] = useState(sp.get("view") || "requests");
  const requestType = sp.get("type") === "DEPOSIT" || sp.get("type") === "WITHDRAW" ? sp.get("type") : "";
  const [days, setDays] = useState(30);
  const [requests, setRequests] = useState<Request[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const typeQuery = requestType ? `&type=${encodeURIComponent(requestType)}` : "";
    fetch(`/api/wallet/records?view=${encodeURIComponent(view)}&days=${days}${typeQuery}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) { setRequests(j.data.requests || []); setTxs(j.data.transactions || []); setBets(j.data.bets || []); } })
      .finally(() => setLoading(false));
  }, [view, requestType, days]);

  const title = view === "bets"
    ? t("Betting records", "বেটিং রেকর্ড")
    : view === "money"
      ? t("Money records", "মানি রেকর্ড")
      : requestType === "DEPOSIT"
        ? t("Deposit records", "জমা রেকর্ড")
        : requestType === "WITHDRAW"
          ? t("Withdraw records", "উতোলন রেকর্ড")
          : t("Deposit and withdrawal records", "জমা ও উত্তোলন রেকর্ড");

  return <div className="-mx-3 -mt-3 min-h-[calc(100dvh-5rem)] bg-[#f7f7f7] px-3 pb-24 text-[#171717]">
    <header className="-mx-3 flex items-center gap-3 bg-[#121212] px-4 py-4 text-white"><Link href="/profile" className="rounded-full p-1"><ArrowLeft className="h-6 w-6" /></Link><h1 className="flex-1 text-center text-lg font-black">{title}</h1><span className="w-7" /></header>
    <main className="mx-auto max-w-lg space-y-4 py-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">{[{ id: "bets", en: "Bets", bn: "বেট" }, { id: "money", en: "Money", bn: "মানি" }, { id: "requests", en: "Requests", bn: "রিকোয়েস্ট" }].map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`min-h-10 rounded-xl text-xs font-black ${view === item.id ? "bg-[#c9a227] text-[#171717]" : "text-black/50"}`}>{t(item.en, item.bn)}</button>)}</div>
      <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"><CalendarDays className="h-4 w-4 text-[#c9a227]" /><select value={days} onChange={(e) => setDays(Number(e.target.value))} className="flex-1 bg-transparent text-sm font-bold outline-none"><option value={1}>{t("Today", "আজ")}</option><option value={2}>{t("Yesterday + today", "আজ ও গতকাল")}</option><option value={7}>{t("7 days", "৭ দিন")}</option><option value={30}>{t("30 days", "৩০ দিন")}</option></select><Search className="h-4 w-4 text-black/30" /></div>
      {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-black/50">{t("Loading records...", "রেকর্ড লোড হচ্ছে...")}</div> : view === "bets" ? (bets.length ? <div className="space-y-2">{bets.map((b) => <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div><div className="font-black">{b.gameType}</div><div className="text-xs text-black/45">{new Date(b.createdAt).toLocaleString()}</div></div><div className="text-right"><div className="text-xs text-black/50">-{formatCoins(b.amount)} TK</div><div className={`font-black ${b.won ? "text-emerald-600" : "text-rose-500"}`}>{b.won ? `+${formatCoins(b.payout)} TK` : t("Lose", "হার")}</div></div></div>)}</div> : <Empty text={t("No betting records", "কোনো বেটিং রেকর্ড নেই")} />) : view === "money" ? (txs.length ? <div className="space-y-2">{txs.map((tx) => <div key={tx.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div className="flex justify-between gap-3"><div><div className="font-black">{tx.method || tx.type}</div><div className="text-xs text-black/45">{tx.note || new Date(tx.createdAt).toLocaleString()}</div></div><div className={`font-black ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{tx.amount >= 0 ? "+" : ""}{formatCoins(tx.amount)} TK</div></div><div className="mt-2 flex flex-wrap gap-2 text-[10px] text-black/45"><span>{tx.status || "—"}</span>{tx.reference && <span>Ref: {tx.reference}</span>}{tx.feeAmount ? <span>Fee: {formatCoins(tx.feeAmount)} TK</span> : null}</div></div>)}</div> : <Empty text={t("No money records", "কোনো মানি রেকর্ড নেই")} />) : (requests.length ? <div className="space-y-2">{requests.map((r) => <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"><div className="flex justify-between gap-3"><div><div className="font-black">{r.method} · {r.type}</div><div className="text-xs text-black/45">{new Date(r.createdAt).toLocaleString()}</div></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : r.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>Ref: <b>{r.id.slice(-10)}</b></span><span className="text-right">Amount: <b>{formatCoins(r.amount)} TK</b></span>{r.trxId && <span>TrxID: <b>{r.trxId}</b></span>}{r.feeAmount ? <span className="text-right">Fee: <b>{formatCoins(r.feeAmount)} TK</b></span> : null}{r.bonusAmount ? <span>Bonus: <b>{formatCoins(r.bonusAmount)} TK</b></span> : null}</div>{(r.rejectionReason || r.adminNote) && <p className="mt-2 rounded-lg bg-rose-50 px-2 py-2 text-[11px] text-rose-700">{r.rejectionReason || r.adminNote}</p>}</div>)}</div> : <Empty text={t("No wallet requests", "কোনো ওয়ালেট রিকোয়েস্ট নেই")} />)}
    </main>
  </div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/45">{text}</div>; }

export default function WalletRecordsPage() {
  return <Suspense fallback={<div className="p-6 text-center text-black/50">Loading…</div>}><WalletRecordsContent /></Suspense>;
}
