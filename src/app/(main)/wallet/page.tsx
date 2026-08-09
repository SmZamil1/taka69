"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PAYMENT_METHODS } from "@/lib/games-meta";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";

type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

type Bet = {
  id: string;
  gameType: string;
  amount: number;
  payout: number;
  multiplier: number | null;
  won: boolean;
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
  screenshotUrl?: string | null;
  bonusAmount?: number;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function WalletInner() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const sp = useSearchParams();
  const initial = sp.get("tab") || "overview";
  const [tab, setTab] = useState(initial);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState(500);
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState<string>("");
  const [preview, setPreview] = useState("");
  const [payCfg, setPayCfg] = useState<any>(null);
  const [histTab, setHistTab] = useState<"money" | "bets" | "requests">("money");

  async function load() {
    if (!user) return;
    const [w, r] = await Promise.all([
      fetch("/api/wallet?tab=all", { credentials: "include" }).then((x) => x.json()),
      fetch("/api/wallet/request", { credentials: "include" }).then((x) => x.json()),
    ]);
    if (w.ok) {
      setTxs(w.data.transactions || []);
      setBets(w.data.bets || []);
      setBalance(w.data.balance);
    }
    if (r.ok) {
      setReqs(r.data.requests || []);
      setPayCfg(r.data.paymentConfig);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    setTab(initial);
  }, [initial]);

  async function onPickScreenshot(file?: File | null) {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error(t("Too large", "অনেক বড়"), t("Max 2.5MB", "সর্বোচ্চ ২.৫MB"));
      return;
    }
    const data = await fileToDataUrl(file);
    setScreenshot(data);
    setPreview(data);
  }

  async function submit(type: "DEPOSIT" | "WITHDRAW") {
    if (!user) return;
    setLoading(true);
    setMsg("");
    try {
      const body: Record<string, unknown> = {
        type,
        method,
        amount,
        accountNo: accountNo || undefined,
        accountName: accountName || undefined,
        trxId: type === "DEPOSIT" ? trxId.trim() : undefined,
        screenshot: type === "DEPOSIT" ? screenshot : undefined,
      };
      const res = await fetch("/api/wallet/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error);
        toast.error(json.error);
      } else {
        toast.success(t("Submitted", "জমা হয়েছে"), json.data.message);
        setTrxId("");
        setScreenshot("");
        setPreview("");
        if (typeof json.data.balance === "number") setBalance(json.data.balance);
        await load();
        setTab("history");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="premium-card text-center space-y-3">
        <p>{t("Login to open wallet", "ওয়ালেট খুলতে লগইন করুন")}</p>
        <Link href="/login"><Button variant="gold">{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  const methods = PAYMENT_METHODS;
  const tabs = [
    { id: "overview", en: "Overview", bn: "ওভারভিউ" },
    { id: "deposit", en: "Deposit", bn: "ডিপোজিট" },
    { id: "withdraw", en: "Withdraw", bn: "উইথড্র" },
    { id: "history", en: "History", bn: "হিস্ট্রি" },
  ];

  const moneyTx = txs.filter((x) => !["BET", "WIN"].includes(x.type));

  return (
    <div className="space-y-4">
      <div className="premium-card">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/50">{t("Balance", "ব্যালেন্স")}</div>
        <div className="mt-1 text-3xl font-black text-gold-300">{formatCoins(user.balance)} TK</div>
        <p className="mt-1 text-[11px] text-emerald-200/50">
          {t("Virtual play-money only", "শুধু ভার্চুয়াল প্লে-মানি")}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
              tab === tb.id
                ? "border-gold-400/50 bg-gold-500 text-emerald-950"
                : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            {t(tb.en, tb.bn)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setTab("deposit")}>{t("Deposit", "ডিপোজিট")}</Button>
            <Button variant="soft" onClick={() => setTab("withdraw")}>{t("Withdraw", "উইথড্র")}</Button>
          </div>
          <div className="premium-card space-y-2">
            <div className="text-sm font-bold">{t("Recent money", "সাম্প্রতিক মানি")}</div>
            {moneyTx.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-emerald-100/70">{tx.type}</span>
                <span className={tx.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {tx.amount >= 0 ? "+" : ""}{formatCoins(tx.amount)} TK
                </span>
              </div>
            ))}
            {!moneyTx.length && <p className="text-xs text-emerald-200/50">{t("No transactions", "কোনো ট্রানজেকশন নেই")}</p>}
          </div>
        </div>
      )}

      {(tab === "deposit" || tab === "withdraw") && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border p-3 text-left",
                  method === m.id ? "border-gold-400 bg-gold-500/10" : "border-emerald-800 bg-emerald-950/50"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt={m.name} className="h-10 w-20 object-contain drop-shadow" onError={(e) => { (e.target as HTMLImageElement).src = m.logo.replace('.png', '.svg'); }} />
                <div>
                  <div className="text-sm font-bold">{m.name}</div>
                  <div className="text-[10px] text-emerald-200/50">{t(m.noteEn, m.noteBn)}</div>
                </div>
              </button>
            ))}
          </div>

          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            placeholder={t("Amount TK", "পরিমাণ TK")}
          />

          {tab === "withdraw" && (
            <>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={t("Account name", "অ্যাকাউন্ট নাম")} />
              <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder={t("Account number", "অ্যাকাউন্ট নম্বর")} />
            </>
          )}

          {tab === "deposit" && (
            <>
              <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder={t("TrxID (unique)", "TrxID (ইউনিক)")} />
              <label className="block rounded-2xl border border-dashed border-emerald-700 bg-black/20 p-4 text-center cursor-pointer">
                <div className="text-sm font-semibold text-emerald-100">
                  {t("Upload payment screenshot", "পেমেন্ট স্ক্রিনশট আপলোড")}
                </div>
                <div className="text-[10px] text-emerald-200/50 mt-1">
                  {t("JPG/PNG/WEBP · max 2.5MB · auto-delete after 24h", "JPG/PNG/WEBP · সর্বোচ্চ ২.৫MB · ২৪ ঘণ্টায় অটো-ডিলিট")}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onPickScreenshot(e.target.files?.[0])}
                />
              </label>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="max-h-48 w-full rounded-xl object-contain border border-emerald-800" />
              )}
            </>
          )}

          {msg && <p className="text-sm text-rose-400">{msg}</p>}
          <Button
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={() => submit(tab === "deposit" ? "DEPOSIT" : "WITHDRAW")}
          >
            {tab === "deposit" ? t("Submit deposit", "ডিপোজিট জমা দিন") : t("Submit withdraw", "উইথড্র জমা দিন")}
          </Button>
          {payCfg?.noticeEn && (
            <p className="text-[11px] text-emerald-200/45">{t(payCfg.noticeEn, payCfg.noticeBn || payCfg.noticeEn)}</p>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              { id: "money", en: "Money", bn: "মানি" },
              { id: "bets", en: "Bets", bn: "বেট" },
              { id: "requests", en: "Requests", bn: "রিকোয়েস্ট" },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setHistTab(h.id as typeof histTab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold border",
                  histTab === h.id ? "bg-emerald-500 text-white border-emerald-400" : "border-emerald-800 text-emerald-100"
                )}
              >
                {t(h.en, h.bn)}
              </button>
            ))}
          </div>

          {histTab === "money" && moneyTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{tx.type}</div>
                <div className="text-[10px] text-emerald-200/50">{tx.note || new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <div className={tx.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {tx.amount >= 0 ? "+" : ""}{formatCoins(tx.amount)} TK
              </div>
            </div>
          ))}

          {histTab === "bets" && bets.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{b.gameType}</div>
                <div className="text-[10px] text-emerald-200/50">{new Date(b.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-200/60">-{formatCoins(b.amount)} TK</div>
                <div className={b.won ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {b.won ? `+${formatCoins(b.payout)} TK` : t("Lose", "হার")}
                  {b.multiplier ? ` · ${b.multiplier}x` : ""}
                </div>
              </div>
            </div>
          ))}

          {histTab === "requests" && reqs.map((r) => (
            <div key={r.id} className="rounded-xl bg-black/20 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">{r.type} · {r.method}</span>
                <span className="text-gold-300 font-bold">{formatCoins(r.amount)} TK</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-200/50">
                <span>{r.status}{r.trxId ? ` · ${r.trxId}` : ""}{r.bonusAmount ? ` · bonus ${r.bonusAmount}` : ""}</span>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.screenshotUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.screenshotUrl} alt="shot" className="mt-1 max-h-28 rounded-lg border border-emerald-900 object-contain" />
              )}
            </div>
          ))}
        </div>
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
