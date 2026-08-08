"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PAYMENT_METHODS } from "@/lib/games-meta";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

type Req = {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  createdAt: string;
  trxId?: string | null;
};

function WalletInner() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const refresh = useAuthStore((s) => s.refresh);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const sp = useSearchParams();
  const initial = sp.get("tab") || "overview";
  const [tab, setTab] = useState(initial);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState(500);
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [trxId, setTrxId] = useState("");

  async function load() {
    if (!user) return;
    const [w, r] = await Promise.all([
      fetch("/api/wallet", { credentials: "include" }).then((x) => x.json()),
      fetch("/api/wallet/request", { credentials: "include" }).then((x) => x.json()),
    ]);
    if (w.ok) setTxs(w.data.transactions);
    if (r.ok) setReqs(r.data.requests);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function claimDaily() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "daily" }),
    });
    const json = await res.json();
    if (!json.ok) { setMsg(json.error); toast.error(t("Failed", "ব্যর্থ"), json.error); }
    else {
      setBalance(json.data.balance);
      setMsg(t(`+${json.data.bonus} TC claimed!`, `+${json.data.bonus} টিসি পেয়েছেন!`));
      toast.success(t("Daily bonus", "দৈনিক বোনাস"), `+${json.data.bonus} TC`);
      refresh();
      load();
    }
    setLoading(false);
  }

  async function submitRequest(type: "DEPOSIT" | "WITHDRAW") {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/wallet/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type,
        method,
        amount,
        accountNo: accountNo || undefined,
        accountName: accountName || undefined,
        trxId: trxId || undefined,
      }),
    });
    const json = await res.json();
    if (!json.ok) { setMsg(json.error); toast.error(t("Request failed", "রিকোয়েস্ট ব্যর্থ"), json.error); }
    else {
      if (typeof json.data.balance === "number") setBalance(json.data.balance);
      setMsg(json.data.message || "OK");
      toast.success(t("Request submitted", "রিকোয়েস্ট জমা"), json.data.message || "OK");
      setTrxId("");
      load();
      refresh();
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="premium-card text-center space-y-3">
        <p>{t("Login to view wallet", "ওয়ালেট দেখতে লগইন করুন")}</p>
        <Link href="/login"><Button variant="gold">{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", en: "Overview", bn: "ওভারভিউ" },
    { id: "deposit", en: "Deposit", bn: "ডিপোজিট" },
    { id: "withdraw", en: "Withdraw", bn: "উত্তোলন" },
    { id: "history", en: "History", bn: "ইতিহাস" },
  ];

  return (
    <div className="space-y-4">
      <div className="premium-card bg-gradient-to-br from-emerald-800/80 to-surface-950 text-center relative overflow-hidden">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="text-xs uppercase tracking-widest text-emerald-200/70 relative">
          {t("Balance (play money)", "ব্যালেন্স (প্লে-মানি)")}
        </div>
        <div className="mt-1 text-4xl font-black text-gold-300 relative">
          {formatCoins(user.balance)} <span className="text-lg">TC</span>
        </div>
        <p className="mt-2 text-[11px] text-emerald-200/50 relative">
          {t("TC = Taka Coins · no cash value", "TC = টাকা কয়েন · নগদ মূল্য নেই")}
        </p>
        <Button variant="gold" className="mt-4 w-full relative" onClick={claimDaily} disabled={loading}>
          {t("Claim daily 500 TC", "দৈনিক ৫০০ টিসি নিন")}
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-xs font-bold",
              tab === tb.id ? "bg-gold-500 text-emerald-950" : "bg-emerald-950 text-emerald-100"
            )}
          >
            {t(tb.en, tb.bn)}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-gold-300">{msg}</p>}

      {(tab === "deposit" || tab === "withdraw") && (
        <div className="premium-card space-y-3">
          <p className="text-xs text-amber-200/80 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2">
            {t(
              "Virtual TC requests only. Admin reviews and credits/debits play-money. No real bKash cash movement.",
              "শুধু ভার্চুয়াল TC রিকোয়েস্ট। অ্যাডমিন রিভিউ করে প্লে-মানি দেয়/কাটে। আসল bKash ক্যাশ মুভমেন্ট নেই।"
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm font-bold",
                  method === m.id ? "border-gold-400 bg-gold-500/15 text-gold-200" : "border-emerald-800 bg-black/20"
                )}
              >
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs text-white" style={{ background: m.color }}>
                  {m.logo}
                </span>
                {m.name}
              </button>
            ))}
          </div>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} placeholder="Amount" />
          {tab === "deposit" ? (
            <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder={t("TrxID", "ট্রানজেকশন আইডি")} />
          ) : (
            <>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={t("Account name", "অ্যাকাউন্ট নাম")} />
              <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder={t("Wallet number", "ওয়ালেট নম্বর")} />
            </>
          )}
          <Button
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={() => submitRequest(tab === "deposit" ? "DEPOSIT" : "WITHDRAW")}
          >
            {tab === "deposit"
              ? t("Submit deposit request", "ডিপোজিট রিকোয়েস্ট পাঠান")
              : t("Submit withdraw request", "উইথড্র রিকোয়েস্ট পাঠান")}
          </Button>
        </div>
      )}

      {(tab === "overview" || tab === "history") && (
        <>
          <div className="premium-card">
            <h2 className="mb-3 font-bold">{t("Requests", "রিকোয়েস্ট")}</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{r.type} · {r.method}</div>
                    <div className="text-[10px] text-emerald-200/50">{new Date(r.createdAt).toLocaleString()} · {r.status}</div>
                  </div>
                  <div className="font-bold text-gold-300">{formatCoins(r.amount)}</div>
                </div>
              ))}
              {!reqs.length && <p className="text-sm text-emerald-200/50">{t("No requests", "কোনো রিকোয়েস্ট নেই")}</p>}
            </div>
          </div>
          <div className="premium-card">
            <h2 className="mb-3 font-bold">{t("Transactions", "লেনদেন")}</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {txs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{tx.type}</div>
                    <div className="text-[10px] text-emerald-200/50">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={tx.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {formatCoins(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-4 text-emerald-200/60">Loading…</div>}>
      <WalletInner />
    </Suspense>
  );
}
