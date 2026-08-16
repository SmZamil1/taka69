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
      <div className="rounded-2xl border border-[#dce8f2] bg-white p-6 text-center text-[#173251] shadow-[0_7px_22px_rgba(48,89,125,0.08)] space-y-3">
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
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#f4f8fc] px-3 pb-24 pt-3 text-[#173251]">
      {/* Header */}
      <div className="-mx-3 -mt-3 mb-1 flex items-center gap-2 bg-[#102b57] px-3 py-3 text-white shadow-[0_5px_18px_rgba(16,43,87,0.22)]">
        <button
          type="button"
          onClick={() => {
            if (tab === "deposit" && step > 1) setStep((s) => (s === 3 ? 2 : 1));
            else if (tab !== "overview") {
              setTab("overview");
              router.replace("/wallet");
            } else router.push("/");
          }}
          className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/15"
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
          className="rounded-full p-2 text-blue-100/80 hover:bg-white/10"
          aria-label="records"
        >
          <ClipboardList className="h-5 w-5" />
        </button>
        <Link href="/" className="rounded-full p-2 text-blue-100/80 hover:bg-white/10">
          <Headphones className="h-5 w-5" />
        </Link>
      </div>

      {/* Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-[#183d73] via-[#245ca1] to-[#4e9ed0] p-4 text-white shadow-[0_12px_28px_rgba(31,91,153,0.2)]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8aa0b4]">
          {t("Balance", "ব্যালেন্স")}
        </div>
        <div className="mt-1 text-3xl font-black text-white tabular-nums">
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
                ? "border-[#2f80c5] bg-[#2f80c5] text-white shadow-[0_5px_14px_rgba(47,128,197,0.22)]"
                : "border-[#dce8f2] bg-white text-[#5d7690]"
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
              className="rounded-2xl bg-[#2f80c5] py-3 text-sm font-black text-white shadow-[0_7px_18px_rgba(47,128,197,0.25)]"
            >
              {t("Deposit", "ডিপোজিট")}
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className="rounded-2xl border border-[#bcd4e7] bg-white py-3 text-sm font-black text-[#24527d] shadow-sm"
            >
              {t("Withdraw", "উইথড্র")}
            </button>
          </div>
          <div className="rounded-2xl border border-[#dce8f2] bg-white p-3 text-[#173251] shadow-[0_7px_22px_rgba(48,89,125,0.07)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t("Recent requests", "সাম্প্রতিক রিকোয়েস্ট")}</span>
              <button
                className="text-[11px] text-[#2f80c5]"
                onClick={() => {
                  setTab("history");
                  setHistTab("requests");
                }}
              >
                {t("See all", "সব দেখুন")} <ChevronRight className="inline h-3 w-3" />
              </button>
            </div>
            {reqs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-t border-[#e7eef5] pt-2">
                <div>
                  <div className="font-medium">
                    {r.type} · {r.method}
                  </div>
                  <div className="text-[10px] text-[#8aa0b4]">{r.status}</div>
                </div>
                <div className="font-bold text-[#2f80c5]">{formatCoins(r.amount)} BDT</div>
              </div>
            ))}
            {!reqs.length && (
              <p className="text-xs text-[#8aa0b4]">{t("No requests yet", "এখনো কোনো রিকোয়েস্ট নেই")}</p>
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
                <div className="mb-2 text-sm font-bold text-[#173251]">
                  · {t("Deposit mode", "আমানতের মোড")}
                </div>
                <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
                  {PAYMENT_METHODS.filter((m) => ["nagad", "bkash", "rocket"].includes(m.id)).map(
                    (m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                          "relative rounded-xl border-2 bg-white p-3 text-center transition",
                          method === m.id ? "border-[#2f80c5] shadow-md" : "border-transparent"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.logo} alt={m.name} className="mx-auto h-8 object-contain" />
                        <div className="mt-1 text-[11px] font-bold text-[#173251]">{m.name}</div>
                        <div className="text-[10px] font-bold text-[#2f80c5]">+2%</div>
                        {method === m.id && (
                          <span className="absolute bottom-1 right-1 text-[#2f80c5]">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#d85b6c]">
                  {t(
                    `Please transfer via your ${method.toUpperCase()} account and paste the correct TRX ID on the payment page. Wrong TRX ID = failed deposit.`,
                    `অনুগ্রহ করে আপনার (${method === "nagad" ? "Nagad" : method}) অ্যাকাউন্টের মাধ্যমে অর্থ স্থানান্তর করুন এবং পেমেন্ট পাতায় TRX ID সঠিকভাবে পূরণ করুন। ⚠️ ভুল TRX ID হলে লেনদেন সফল হবে না।`
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#173251]">
                  · {t("Payment channel", "পেমেন্ট চ্যানেল")}
                </div>
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
                  {channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChannel(c.id)}
                      className={cn(
                        "relative rounded-xl border bg-white px-2 py-3 text-left text-[12px] font-semibold text-[#173251]",
                        channel === c.id ? "border-[#2f80c5] ring-1 ring-[#76b1dc]" : "border-[#dce8f2]"
                      )}
                    >
                      <span className="absolute right-1 top-1 rounded bg-[#2f80c5] px-1 text-[9px] font-black text-white">
                        {c.bonus}
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#d85b6c]">
                  {t(
                    "Always use the latest account. Wrong transfer account cannot be refunded.",
                    "প্রতিটি জমার সময় সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। ভুল অ্যাকাউন্টে ট্রান্সফার করলে অর্থ ফেরত পাওয়া যাবে না।"
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#173251]">
                  · {t("Deposit amount", "জমা পরিমাণ")}
                </div>
                <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-4">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={cn(
                        "relative rounded-xl border bg-white py-2.5 text-sm font-bold text-[#173251]",
                        amount === a ? "border-[#2f80c5] text-[#2f80c5]" : "border-[#dce8f2]"
                      )}
                    >
                      {a.toLocaleString()}
                      {amount === a && (
                        <span className="absolute bottom-0 right-0 h-0 w-0 border-b-[14px] border-l-[14px] border-b-[#2f80c5] border-l-transparent" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 rounded-xl border border-[#dce8f2] bg-white px-3 py-2.5 text-sm text-[#173251]">
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
                <div className="mt-1 text-[10px] text-[#8aa0b4]">
                  {minDep} - {maxDep.toLocaleString()} BDT
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#173251]">· {t("Promo", "কার্যক্রম")}</div>
                <label className="flex items-center gap-2 rounded-xl border border-[#dce8f2] bg-[#f8fbfe] px-3 py-3 text-sm">
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
                    toast.error(`Min ${minDep} BDT`);
                    return;
                  }
                  setStep(2);
                }}
                className="w-full rounded-xl bg-[#2f80c5] py-3.5 text-sm font-black text-white shadow-lg active:scale-[0.99]"
              >
                {t("Next", "পরবর্তী")}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-xl bg-[#102b57] text-white px-3 py-2 text-sm font-bold flex justify-between">
                <span>
                  BDT {amount.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold opacity-80">PAY SERVICE</span>
              </div>
              <p className="text-[12px] font-semibold text-[#d85b6c] leading-snug">
                {t(
                  `If you change the amount (BDT ${amount.toFixed(2)}), you will not receive credit.`,
                  `আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT ${amount.toFixed(2)}), আপনি ক্রেডিট পেতে সক্ষম হবেন না।`
                )}
              </p>

              <div className="rounded-xl bg-[#2f80c5] px-4 py-3 text-white font-black flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/payments/${method}.png`} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
                {method.toUpperCase()} Deposit
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#173251]">
                  Wallet No<span className="text-[#d85b6c]">*</span>
                </div>
                <p className="text-[11px] text-[#173251]/50">
                  {t(
                    `Cash-out only to this ${method.toUpperCase()} number`,
                    `এই ${method.toUpperCase()} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়`
                  )}
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-[#173251] shadow-sm font-bold">
                  <span className="flex-1 tracking-wide">{recv.no}</span>
                  <button
                    type="button"
                    onClick={() => copyText(recv.no)}
                    className="rounded-lg bg-[#2f80c5] p-2 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#173251]">
                  {t("Cash-out TrxID (required)", "ক্যাশআউটের TrxID নাম্বারটি লিখুন(প্রয়োজন)")}
                  <span className="text-[#d85b6c]">*</span>
                </div>
                <button
                  type="button"
                  className="text-[12px] text-[#2f80c5] underline"
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
                    "w-full rounded-xl border-2 bg-white px-3 py-3 text-sm font-bold text-[#173251] outline-none",
                    !trxId ? "border-rose-500" : "border-emerald-500"
                  )}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#173251]">
                  {t("Screenshot (optional)", "স্ক্রিনশট (ঐচ্ছিক)")}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickScreenshot(e.target.files?.[0])}
                  className="block w-full text-xs text-[#173251]/70"
                />
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="mt-1 max-h-32 rounded-lg border border-[#dce8f2]" />
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-[#d85b6c]">
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
                  className="flex-1 rounded-xl border border-[#bcd4e7] py-3 text-sm font-bold text-[#173251]"
                >
                  {t("Back", "পিছনে")}
                </button>
                <button
                  type="button"
                  disabled={!trxId.trim()}
                  onClick={() => setConfirmOpen(true)}
                  className="flex-[2] rounded-xl bg-white py-3 text-sm font-black text-[#173251] disabled:opacity-40"
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
                <p className="mt-2 text-center text-lg font-black text-[#d85b6c]">{trxId}</p>
                <p className="text-center text-sm">is correct!</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 rounded-full bg-[#e8f2fb] py-2.5 text-sm font-bold text-[#24527d]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submit("DEPOSIT")}
                    className="flex-1 rounded-full bg-emerald-700 py-2.5 text-sm font-bold text-[#173251]"
                  >
                    {loading ? "..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {msg && <p className="text-sm text-[#d85b6c]">{msg}</p>}
        </div>
      )}

      {tab === "withdraw" && (
        <div className="space-y-3">
          <p className="text-[12px] text-[#173251]/50">
            {t(`Minimum withdraw ${minWd} BDT`, `সর্বনিম্ন উত্তোলন ${minWd} BDT`)}
          </p>
          <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-xl border p-2 bg-white",
                  method === m.id ? "border-[#2f80c5]" : "border-transparent"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt={m.name} className="mx-auto h-7 object-contain" />
                <div className="text-[10px] font-bold text-[#173251] text-center">{m.name}</div>
              </button>
            ))}
          </div>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={t("Account holder full name", "প্রাপকের পূর্ণ নাম লিখুন")}
            className="w-full rounded-xl border border-[#dce8f2] bg-white px-3 py-3 text-sm text-[#173251] outline-none placeholder:text-[#91a5b7]"
          />
          <input
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder={t("Wallet account number", "ওয়ালেট অ্যাকাউন্ট নম্বর")}
            className="w-full rounded-xl border border-[#dce8f2] bg-white px-3 py-3 text-sm text-[#173251] outline-none placeholder:text-[#91a5b7]"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            placeholder="Amount"
            className="w-full rounded-xl border border-[#dce8f2] bg-white px-3 py-3 text-sm text-[#173251] outline-none placeholder:text-[#91a5b7]"
          />
          <button
            type="button"
            disabled={loading || !accountNo || amount < minWd}
            onClick={() => submit("WITHDRAW")}
            className="w-full rounded-xl bg-[#2f80c5] py-3.5 text-sm font-black text-[#173251] disabled:opacity-40"
          >
            {loading ? "..." : t("Submit withdraw", "উত্তোলন জমা দিন")}
          </button>
          {msg && <p className="text-sm text-[#d85b6c]">{msg}</p>}
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
                    ? "bg-emerald-500 text-[#173251] border-emerald-400"
                    : "border-[#bcd4e7] text-[#5d7690]"
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
                className="flex items-center justify-between rounded-xl border border-[#e1ebf3] bg-white px-3 py-2 text-sm text-[#173251] shadow-sm"
              >
                <div>
                  <div className="font-medium">{tx.type}</div>
                  <div className="text-[10px] text-[#8aa0b4]">
                    {tx.note || new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={tx.amount >= 0 ? "text-[#198754] font-bold" : "text-[#d85b6c] font-bold"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)} BDT
                </div>
              </div>
            ))}

          {histTab === "bets" &&
            bets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-[#e1ebf3] bg-white px-3 py-2 text-sm text-[#173251] shadow-sm"
              >
                <div>
                  <div className="font-medium">{b.gameType}</div>
                  <div className="text-[10px] text-[#8aa0b4]">
                    {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6c849b]">-{formatCoins(b.amount)} BDT</div>
                  <div className={b.won ? "text-[#198754] font-bold" : "text-[#d85b6c] font-bold"}>
                    {b.won ? `+${formatCoins(b.payout)} BDT` : t("Lose", "হার")}
                    {b.multiplier ? ` · ${b.multiplier}x` : ""}
                  </div>
                </div>
              </div>
            ))}

          {histTab === "requests" &&
            reqs.map((r) => (
              <div key={r.id} className="rounded-xl border border-[#dce8f2] bg-white text-[#173251] px-3 py-3 text-sm space-y-1 shadow-[0_7px_18px_rgba(48,89,125,0.08)]">
                <div className="font-bold uppercase">{r.method}</div>
                <div className="text-[11px] text-[#7891a8]">{new Date(r.createdAt).toLocaleString()}</div>
                <div className="rounded-lg bg-[#f8fbfe] p-2 text-[12px] space-y-1">
                  <div>
                    {t("Ref#", "জমা রেফ#")}: {r.id.slice(-12)}
                  </div>
                  {r.trxId && <div>TrxID: {r.trxId}</div>}
                  <div className="flex justify-between pt-1 border-t border-[#dce8f2]">
                    <span className="text-[#d85b6c] font-bold">{Number(r.amount).toFixed(2)}</span>
                    <span className="text-[#7891a8]">{r.status}</span>
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
    <Suspense fallback={<div className="p-4 text-[#6c849b]">Loading…</div>}>
      <WalletInner />
    </Suspense>
  );
}
