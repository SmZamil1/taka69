"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PAYMENT_METHODS } from "@/lib/games-meta";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ClipboardList,
  Headphones,
  ChevronRight,
} from "lucide-react";

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

const QUICK_AMOUNTS = [100, 300, 500, 1000, 3000, 5000, 10000, 25000];

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
  const router = useRouter();
  const initial = sp.get("tab") || "overview";

  const [tab, setTab] = useState(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("nagad");
  const [channel, setChannel] = useState("ch21");
  const [amount, setAmount] = useState(100);
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [preview, setPreview] = useState("");
  const [payCfg, setPayCfg] = useState<Record<string, unknown> | null>(null);
  const [histTab, setHistTab] = useState<"money" | "bets" | "requests">("requests");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoNone, setPromoNone] = useState(true);

  // Admin receive numbers (display only — users send money here)
  const RECEIVE: Record<string, { no: string; name: string }> = {
    nagad: { no: "01778875822", name: "TAKA69 NAGAD" },
    bkash: { no: "01778875822", name: "TAKA69 BKASH" },
    rocket: { no: "01778875822", name: "TAKA69 ROCKET" },
    upay: { no: "01778875822", name: "TAKA69 UPAY" },
  };

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
    if (initial === "deposit") setStep(1);
  }, [initial]);

  const minDep = Number(payCfg?.minDeposit ?? 100);
  const maxDep = Number(payCfg?.maxDeposit ?? 25000);
  const minWd = Number(payCfg?.minWithdraw ?? 200);

  const channels = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: `ch${i + 1}`,
        label: t(`Recharge channel ${i + 1}`, `রিচার্জ চ্যানেল ${i + 1 === 1 ? "১" : i + 1}`),
        bonus: "+2%",
      })),
    [t]
  );

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

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(t("Copied", "কপি হয়েছে")),
      () => toast.error("Copy failed")
    );
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
        setConfirmOpen(false);
        setStep(1);
        if (typeof json.data.balance === "number") setBalance(json.data.balance);
        await load();
        setTab("history");
        setHistTab("requests");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-emerald-950/50 p-6 text-center space-y-3">
        <p>{t("Login to open wallet", "ওয়ালেট খুলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button variant="gold">{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  const moneyTx = txs.filter((x) => !["BET", "WIN", "WINGO_BET", "WINGO_WIN"].includes(x.type));
  const recv = RECEIVE[method] || RECEIVE.nagad;

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (tab === "deposit" && step > 1) setStep((s) => (s === 3 ? 2 : 1));
            else if (tab !== "overview") {
              setTab("overview");
              router.replace("/wallet");
            } else router.push("/");
          }}
          className="rounded-full border border-white/10 bg-white/5 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-black text-white">
          {tab === "deposit"
            ? t("Deposit", "জমা দিন")
            : tab === "withdraw"
              ? t("Withdraw", "উত্তোলন")
              : tab === "history"
                ? t("Deposit records", "জমা রেকর্ড")
                : t("Wallet", "ওয়ালেট")}
        </h1>
        <button
          type="button"
          onClick={() => {
            setTab("history");
            setHistTab("requests");
          }}
          className="rounded-full p-2 text-emerald-100/70 hover:bg-white/5"
          aria-label="records"
        >
          <ClipboardList className="h-5 w-5" />
        </button>
        <Link href="/" className="rounded-full p-2 text-emerald-100/70 hover:bg-white/5">
          <Headphones className="h-5 w-5" />
        </Link>
      </div>

      {/* Balance */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-emerald-900/80 to-emerald-950 p-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/50">
          {t("Balance", "ব্যালেন্স")}
        </div>
        <div className="mt-1 text-3xl font-black text-amber-300 tabular-nums">
          ৳ {formatCoins(user.balance)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", en: "Overview", bn: "ওভারভিউ" },
          { id: "deposit", en: "Deposit", bn: "ডিপোজিট" },
          { id: "withdraw", en: "Withdraw", bn: "উইথড্র" },
          { id: "history", en: "History", bn: "হিস্ট্রি" },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => {
              setTab(tb.id);
              if (tb.id === "deposit") setStep(1);
              router.replace(`/wallet?tab=${tb.id}`);
            }}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
              tab === tb.id
                ? "border-amber-400/50 bg-amber-400 text-emerald-950"
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
            <button
              onClick={() => {
                setTab("deposit");
                setStep(1);
              }}
              className="rounded-2xl bg-gradient-to-b from-amber-300 to-yellow-500 py-3 text-sm font-black text-emerald-950 shadow"
            >
              {t("Deposit", "ডিপোজিট")}
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className="rounded-2xl border border-emerald-700 bg-emerald-900/50 py-3 text-sm font-black text-white"
            >
              {t("Withdraw", "উইথড্র")}
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t("Recent requests", "সাম্প্রতিক রিকোয়েস্ট")}</span>
              <button
                className="text-[11px] text-amber-300"
                onClick={() => {
                  setTab("history");
                  setHistTab("requests");
                }}
              >
                {t("See all", "সব দেখুন")} <ChevronRight className="inline h-3 w-3" />
              </button>
            </div>
            {reqs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-t border-white/5 pt-2">
                <div>
                  <div className="font-medium">
                    {r.type} · {r.method}
                  </div>
                  <div className="text-[10px] text-white/40">{r.status}</div>
                </div>
                <div className="font-bold text-amber-300">{formatCoins(r.amount)} TK</div>
              </div>
            ))}
            {!reqs.length && (
              <p className="text-xs text-white/40">{t("No requests yet", "এখনো কোনো রিকোয়েস্ট নেই")}</p>
            )}
          </div>
        </div>
      )}

      {/* DEPOSIT multi-step JETA7 style */}
      {tab === "deposit" && (
        <div className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <div className="mb-2 text-sm font-bold text-white">
                  · {t("Deposit mode", "আমানতের মোড")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.filter((m) => ["nagad", "bkash", "rocket"].includes(m.id)).map(
                    (m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                          "relative rounded-xl border-2 bg-white p-3 text-center transition",
                          method === m.id ? "border-rose-500 shadow-md" : "border-transparent"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.logo} alt={m.name} className="mx-auto h-8 object-contain" />
                        <div className="mt-1 text-[11px] font-bold text-gray-800">{m.name}</div>
                        <div className="text-[10px] font-bold text-rose-500">+2%</div>
                        {method === m.id && (
                          <span className="absolute bottom-1 right-1 text-rose-500">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-rose-400">
                  {t(
                    `Please transfer via your ${method.toUpperCase()} account and paste the correct TRX ID on the payment page. Wrong TRX ID = failed deposit.`,
                    `অনুগ্রহ করে আপনার (${method === "nagad" ? "Nagad" : method}) অ্যাকাউন্টের মাধ্যমে অর্থ স্থানান্তর করুন এবং পেমেন্ট পাতায় TRX ID সঠিকভাবে পূরণ করুন। ⚠️ ভুল TRX ID হলে লেনদেন সফল হবে না।`
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-white">
                  · {t("Payment channel", "পেমেন্ট চ্যানেল")}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChannel(c.id)}
                      className={cn(
                        "relative rounded-xl border bg-white px-2 py-3 text-left text-[12px] font-semibold text-gray-800",
                        channel === c.id ? "border-rose-500 ring-1 ring-rose-400" : "border-gray-200"
                      )}
                    >
                      <span className="absolute right-1 top-1 rounded bg-rose-500 px-1 text-[9px] font-black text-white">
                        {c.bonus}
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-rose-400">
                  {t(
                    "Always use the latest account. Wrong transfer account cannot be refunded.",
                    "প্রতিটি জমার সময় সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। ভুল অ্যাকাউন্টে ট্রান্সফার করলে অর্থ ফেরত পাওয়া যাবে না।"
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-white">
                  · {t("Deposit amount", "জমা পরিমাণ")}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={cn(
                        "relative rounded-xl border bg-white py-2.5 text-sm font-bold text-gray-800",
                        amount === a ? "border-rose-500 text-rose-600" : "border-gray-200"
                      )}
                    >
                      {a.toLocaleString()}
                      {amount === a && (
                        <span className="absolute bottom-0 right-0 h-0 w-0 border-b-[14px] border-l-[14px] border-b-rose-500 border-l-transparent" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700">
                  ৳{" "}
                  <input
                    type="number"
                    value={amount}
                    min={minDep}
                    max={maxDep}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    className="w-[70%] bg-transparent outline-none font-bold"
                  />
                </div>
                <div className="mt-1 text-[10px] text-white/40">
                  {minDep} - {maxDep.toLocaleString()} TK
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-white">· {t("Promo", "কার্যক্রম")}</div>
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
                  <input
                    type="radio"
                    checked={promoNone}
                    onChange={() => setPromoNone(true)}
                    className="accent-rose-500"
                  />
                  {t("Do not participate in any promo", "কোনও প্রচারে অংশ নেওয়া যায় না")}
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (amount < minDep) {
                    toast.error(`Min ${minDep} TK`);
                    return;
                  }
                  setStep(2);
                }}
                className="w-full rounded-xl bg-rose-600 py-3.5 text-sm font-black text-white shadow-lg active:scale-[0.99]"
              >
                {t("Next", "পরবর্তী")}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-xl bg-emerald-900 text-white px-3 py-2 text-sm font-bold flex justify-between">
                <span>
                  BDT {amount.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold opacity-80">PAY SERVICE</span>
              </div>
              <p className="text-[12px] font-semibold text-rose-400 leading-snug">
                {t(
                  `If you change the amount (BDT ${amount.toFixed(2)}), you will not receive credit.`,
                  `আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT ${amount.toFixed(2)}), আপনি ক্রেডিট পেতে সক্ষম হবেন না।`
                )}
              </p>

              <div className="rounded-xl bg-rose-500 px-4 py-3 text-white font-black flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/payments/${method}.png`} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
                {method.toUpperCase()} Deposit
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  Wallet No<span className="text-rose-400">*</span>
                </div>
                <p className="text-[11px] text-white/50">
                  {t(
                    `Cash-out only to this ${method.toUpperCase()} number`,
                    `এই ${method.toUpperCase()} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়`
                  )}
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-3 text-gray-900 font-bold">
                  <span className="flex-1 tracking-wide">{recv.no}</span>
                  <button
                    type="button"
                    onClick={() => copyText(recv.no)}
                    className="rounded-lg bg-emerald-600 p-2 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  {t("Cash-out TrxID (required)", "ক্যাশআউটের TrxID নাম্বারটি লিখুন(প্রয়োজন)")}
                  <span className="text-rose-400">*</span>
                </div>
                <button
                  type="button"
                  className="text-[12px] text-sky-400 underline"
                  onClick={() =>
                    toast.success(
                      t("Tip", "টিপস"),
                      t(
                        "After Send Money, open transaction details and copy Transaction ID.",
                        "সেন্ড মানি করার পর ট্রানজেকশন ডিটেইলস খুলে Transaction ID কপি করুন।"
                      )
                    )
                  }
                >
                  {t("How to get TrxID — tap here", "কিভাবে TrxID পেতে হয় তা দেখতে ক্লিক করুন")}
                </button>
                <input
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  placeholder={t("TrxID is required!", "TrxID অবশ্যই পূরণ করতে হবে!")}
                  className={cn(
                    "w-full rounded-xl border-2 bg-white px-3 py-3 text-sm font-bold text-gray-900 outline-none",
                    !trxId ? "border-rose-500" : "border-emerald-500"
                  )}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  {t("Screenshot (optional)", "স্ক্রিনশট (ঐচ্ছিক)")}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickScreenshot(e.target.files?.[0])}
                  className="block w-full text-xs text-white/70"
                />
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="mt-1 max-h-32 rounded-lg border border-white/10" />
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-rose-400">
                <strong>{t("Warning:", "সতর্কতাঃ")}</strong>{" "}
                {t(
                  "Transaction ID must be filled correctly, otherwise the transfer is wasted!",
                  "লেনদেন আইডি সঠিকভাবে পূরণ করতে হবে, অন্যথায় ক্ষের ব্যর্থ হবে!"
                )}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-bold text-white"
                >
                  {t("Back", "পিছনে")}
                </button>
                <button
                  type="button"
                  disabled={!trxId.trim()}
                  onClick={() => setConfirmOpen(true)}
                  className="flex-[2] rounded-xl bg-white py-3 text-sm font-black text-gray-800 disabled:opacity-40"
                >
                  {t("Confirm", "নিশ্চিত")}
                </button>
              </div>
            </>
          )}

          {confirmOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-gray-900 shadow-2xl">
                <p className="text-sm leading-relaxed">
                  {t(
                    "This order can only be submitted once, please confirm your Transaction ID:",
                    "This order can only be submitted once, please confirm your Transaction ID:"
                  )}
                </p>
                <p className="mt-2 text-center text-lg font-black text-rose-600">{trxId}</p>
                <p className="text-center text-sm">is correct!</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 rounded-full bg-gray-200 py-2.5 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submit("DEPOSIT")}
                    className="flex-1 rounded-full bg-emerald-700 py-2.5 text-sm font-bold text-white"
                  >
                    {loading ? "..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {msg && <p className="text-sm text-rose-400">{msg}</p>}
        </div>
      )}

      {tab === "withdraw" && (
        <div className="space-y-3">
          <p className="text-[12px] text-white/50">
            {t(`Minimum withdraw ${minWd} TK`, `সর্বনিম্ন উত্তোলন ${minWd} TK`)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-xl border p-2 bg-white",
                  method === m.id ? "border-rose-500" : "border-transparent"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt={m.name} className="mx-auto h-7 object-contain" />
                <div className="text-[10px] font-bold text-gray-800 text-center">{m.name}</div>
              </button>
            ))}
          </div>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={t("Account holder full name", "প্রাপকের পূর্ণ নাম লিখুন")}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
          />
          <input
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder={t("Wallet account number", "ওয়ালেট অ্যাকাউন্ট নম্বর")}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            placeholder="Amount"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"
          />
          <button
            type="button"
            disabled={loading || !accountNo || amount < minWd}
            onClick={() => submit("WITHDRAW")}
            className="w-full rounded-xl bg-rose-600 py-3.5 text-sm font-black text-white disabled:opacity-40"
          >
            {loading ? "..." : t("Submit withdraw", "উত্তোলন জমা দিন")}
          </button>
          {msg && <p className="text-sm text-rose-400">{msg}</p>}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              { id: "requests", en: "Requests", bn: "রিকোয়েস্ট" },
              { id: "money", en: "Money", bn: "মানি" },
              { id: "bets", en: "Bets", bn: "বেট" },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setHistTab(h.id as typeof histTab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold border",
                  histTab === h.id
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "border-emerald-800 text-emerald-100"
                )}
              >
                {t(h.en, h.bn)}
              </button>
            ))}
          </div>

          {histTab === "money" &&
            moneyTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{tx.type}</div>
                  <div className="text-[10px] text-emerald-200/50">
                    {tx.note || new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={tx.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)} TK
                </div>
              </div>
            ))}

          {histTab === "bets" &&
            bets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{b.gameType}</div>
                  <div className="text-[10px] text-emerald-200/50">
                    {new Date(b.createdAt).toLocaleString()}
                  </div>
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

          {histTab === "requests" &&
            reqs.map((r) => (
              <div key={r.id} className="rounded-xl bg-white text-gray-900 px-3 py-3 text-sm space-y-1 shadow">
                <div className="font-bold uppercase">{r.method}</div>
                <div className="text-[11px] text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                <div className="rounded-lg bg-gray-50 p-2 text-[12px] space-y-1">
                  <div>
                    {t("Ref#", "জমা রেফ#")}: {r.id.slice(-12)}
                  </div>
                  {r.trxId && <div>TrxID: {r.trxId}</div>}
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="text-rose-600 font-bold">{Number(r.amount).toFixed(2)}</span>
                    <span className="text-gray-500">{r.status}</span>
                  </div>
                </div>
                {r.screenshotUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.screenshotUrl}
                    alt="shot"
                    className="mt-1 max-h-28 rounded-lg border object-contain"
                  />
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
