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
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  Headphones,
  Plus,
  Trash2,
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
  updatedAt?: string;
  trxId?: string | null;
  screenshotUrl?: string | null;
  bonusAmount?: number;
  channel?: string | null;
  grossAmount?: number | null;
  feeAmount?: number;
  netAmount?: number | null;
  providerRef?: string | null;
  rejectionReason?: string | null;
  processedAt?: string | null;
  note?: string | null;
  adminNote?: string | null;
};
type WalletCard = {
  id: string;
  method: string;
  label: string;
  accountNo: string;
  accountName?: string | null;
  status?: string;
  isDefault?: boolean;
  rejectionReason?: string | null;
  createdAt: string;
};
type ConfiguredPaymentMethod = {
  id: string;
  name: string;
  number: string;
  enabled?: boolean;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  logo?: string;
  color?: string;
  type?: string;
  instructionsEn?: string;
  instructionsBn?: string;
  warningEn?: string;
  warningBn?: string;
  feeType?: "NONE" | "FIXED" | "PERCENT";
  feeValue?: number;
  channels?: { id: string; label: string; bonus?: number }[];
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
  const initialView = sp.get("view");
  const requestedHistoryView = initialView === "money" || initialView === "bets" || initialView === "requests" ? initialView : "requests";

  const [tab, setTab] = useState(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");
  const [cardSaving, setCardSaving] = useState(false);
  const [cardMethod, setCardMethod] = useState("bkash");
  const [cardAccountNo, setCardAccountNo] = useState("");
  const [cardAccountName, setCardAccountName] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [method, setMethod] = useState("nagad");
  const [channel, setChannel] = useState("ch21");
  const [amount, setAmount] = useState(100);
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [preview, setPreview] = useState("");
  const [payCfg, setPayCfg] = useState<Record<string, unknown> | null>(null);
  const [histTab, setHistTab] = useState<"money" | "bets" | "requests">(requestedHistoryView);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [promoNone, setPromoNone] = useState(true);
  const [submittedRequest, setSubmittedRequest] = useState<Req | null>(null);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [hasTransactionPassword, setHasTransactionPassword] = useState<boolean | null>(null);

  async function load() {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const [w, r] = await Promise.all([
        fetch("/api/wallet?tab=all", { credentials: "include" }).then((x) => x.json()),
        fetch("/api/wallet/request", { credentials: "include" }).then((x) => x.json()),
      ]);
      if (!w.ok) throw new Error(w.error || t("Could not load wallet history", "ওয়ালেট ইতিহাস লোড করা যায়নি"));
      if (!r.ok) throw new Error(r.error || t("Could not load wallet history", "ওয়ালেট ইতিহাস লোড করা যায়নি"));
      setTxs(w.data.transactions || []);
      setBets(w.data.bets || []);
      setBalance(w.data.balance);
      setReqs(r.data.requests || []);
      setPayCfg(r.data.paymentConfig);
      const security = await fetch("/api/security/transaction-password", { credentials: "include" }).then((x) => x.json());
      if (security.ok) setHasTransactionPassword(Boolean(security.data?.hasTransactionPassword));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : t("Could not load wallet history", "ওয়ালেট ইতিহাস লোড করা যায়নি"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadCards() {
    if (!user) return;
    setCardsLoading(true);
    setCardsError("");
    try {
      const res = await fetch("/api/wallet/cards", { credentials: "include" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || t("Could not load cards", "কার্ড লোড করা যায়নি"));
      setCards(json.data.cards || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("Could not load cards", "কার্ড লোড করা যায়নি");
      setCardsError(message);
    } finally {
      setCardsLoading(false);
    }
  }

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardAccountNo.trim()) return;
    setCardSaving(true);
    try {
      const res = await fetch("/api/wallet/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ method: cardMethod, accountNo: cardAccountNo, accountName: cardAccountName || undefined }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || t("Could not add card", "কার্ড যোগ করা যায়নি"));
        return;
      }
      setCards((current) => [json.data.card, ...current]);
      setCardAccountNo("");
      setCardAccountName("");
      toast.success(t("Card added", "কার্ড যোগ হয়েছে"));
    } catch {
      toast.error(t("Could not add card", "কার্ড যোগ করা যায়নি"));
    } finally {
      setCardSaving(false);
    }
  }

  async function removeCard(id: string) {
    try {
      const res = await fetch(`/api/wallet/cards?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || t("Could not remove card", "কার্ড সরানো যায়নি"));
        return;
      }
      setCards((current) => current.filter((card) => card.id !== id));
      toast.success(t("Card removed", "কার্ড সরানো হয়েছে"));
    } catch {
      toast.error(t("Could not remove card", "কার্ড সরানো যায়নি"));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (user && (tab === "cards" || tab === "withdraw")) loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tab]);

  useEffect(() => {
    setTab(initial);
    if (initial === "deposit") {
      setStep(1);
      setSubmittedRequest(null);
    }
    if (initial === "history") setHistTab(requestedHistoryView);
  }, [initial, requestedHistoryView]);

  const minDep = Number(payCfg?.minDeposit ?? 100);
  const maxDep = Number(payCfg?.maxDeposit ?? 25000);
  const minWd = Number(payCfg?.minWithdraw ?? 200);
  const maxWd = Number(payCfg?.maxWithdraw ?? 50000);
  const configuredMethods = useMemo<ConfiguredPaymentMethod[]>(
    () =>
      (Array.isArray(payCfg?.methods) ? payCfg.methods : [])
        .filter((value): value is ConfiguredPaymentMethod => !!value && typeof value === "object")
        .map((value) => ({
          ...value,
          id: String(value.id || ""),
          name: String(value.name || value.id || ""),
          number: String(value.number || ""),
        }))
        .filter((value) => value.id && value.name && value.enabled !== false),
    [payCfg?.methods]
  );
  const depositMethods = useMemo(() => configuredMethods.filter((value) => value.depositEnabled !== false), [configuredMethods]);
  const withdrawMethods = useMemo(() => configuredMethods.filter((value) => value.withdrawEnabled !== false), [configuredMethods]);
  const selectedPaymentMethod = (tab === "withdraw" ? withdrawMethods : depositMethods).find((value) => value.id === method) || (tab === "withdraw" ? withdrawMethods : depositMethods)[0];
  const notice = t(String(payCfg?.noticeEn || ""), String(payCfg?.noticeBn || ""));
  const selectedMethodInstruction = selectedPaymentMethod
    ? t(selectedPaymentMethod.instructionsEn || "", selectedPaymentMethod.instructionsBn || "")
    : "";
  const selectedMethodWarning = selectedPaymentMethod
    ? t(selectedPaymentMethod.warningEn || "", selectedPaymentMethod.warningBn || "")
    : "";

  useEffect(() => {
    const available = tab === "withdraw" ? withdrawMethods : depositMethods;
    if (available.length && !available.some((value) => value.id === method)) setMethod(available[0].id);
    if (configuredMethods.length && !configuredMethods.some((value) => value.id === cardMethod)) setCardMethod(configuredMethods[0].id);
  }, [configuredMethods, depositMethods, withdrawMethods, method, cardMethod, tab]);

  const withdrawCards = useMemo(
    () => cards.filter((card) => {
      const savedMethod = card.method.toLowerCase();
      return savedMethod === selectedPaymentMethod?.id.toLowerCase() || savedMethod === selectedPaymentMethod?.name.toLowerCase();
    }),
    [cards, selectedPaymentMethod?.id, selectedPaymentMethod?.name]
  );
  const selectedCard = withdrawCards.find((card) => card.id === selectedCardId);

  useEffect(() => {
    if (!selectedCard) setSelectedCardId(withdrawCards[0]?.id || "");
  }, [selectedCard, withdrawCards]);

  function setHistoryView(view: "money" | "bets" | "requests") {
    setHistTab(view);
    router.replace(`/wallet?tab=history&view=${view}`);
  }

  const channels = useMemo(
    () => selectedPaymentMethod?.channels?.length
      ? selectedPaymentMethod.channels
      : [{ id: "standard", label: t("Standard channel", "স্ট্যান্ডার্ড চ্যানেল"), bonus: 0 }],
    [selectedPaymentMethod?.channels, t]
  );

  useEffect(() => {
    if (!channels.some((item) => item.id === channel)) setChannel(channels[0]?.id || "standard");
  }, [channels, channel]);

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
      if (type === "WITHDRAW" && amount > maxWd) {
        const error = t(`Maximum withdraw is ${maxWd} BDT`, `সর্বোচ্চ উত্তোলন ${maxWd} BDT`);
        setMsg(error);
        toast.error(error);
        setLoading(false);
        return;
      }
      if (type === "DEPOSIT" && !selectedPaymentMethod) {
        const error = t("No payment method is configured", "কোনো পেমেন্ট পদ্ধতি কনফিগার করা নেই");
        setMsg(error);
        toast.error(error);
        setLoading(false);
        return;
      }
      if (type === "WITHDRAW" && !selectedPaymentMethod) {
        const error = t("No withdrawal method is configured", "কোনো উত্তোলন পদ্ধতি কনফিগার করা নেই");
        setMsg(error);
        toast.error(error);
        setLoading(false);
        return;
      }
      const body: Record<string, unknown> = {
        type,
        method: selectedPaymentMethod?.id || method,
        channel,
        amount,
        cardId: type === "WITHDRAW" ? selectedCardId || undefined : undefined,
        accountNo: type === "WITHDRAW" && !selectedCardId ? accountNo || undefined : undefined,
        accountName: type === "WITHDRAW" ? accountName || undefined : undefined,
        trxId: type === "DEPOSIT" ? trxId.trim() : undefined,
        screenshot: type === "DEPOSIT" ? screenshot : undefined,
        transactionPassword: type === "WITHDRAW" ? transactionPassword : undefined,
        idempotencyKey: `${type}-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
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
        setSubmittedRequest(json.data.request || null);
        setTransactionPassword("");
        setStep(type === "DEPOSIT" ? 3 : 1);
        if (typeof json.data.balance === "number") setBalance(json.data.balance);
        await load();
        if (type === "WITHDRAW") {
          setTab("history");
          setHistoryView("requests");
        }
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[#33413f] bg-[#242e36] p-6 text-center text-[#f4f7f2] shadow-[0_7px_22px_rgba(48,89,125,0.08)] space-y-3">
        <p>{t("Login to open wallet", "ওয়ালেট খুলতে লগইন করুন")}</p>
        <Link href="/login">
          <Button variant="gold">{t("Login", "লগইন")}</Button>
        </Link>
      </div>
    );
  }

  const moneyTx = txs.filter((x) => !["BET", "WIN", "WINGO_BET", "WINGO_WIN"].includes(x.type));

  return (
    <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#121426] px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] text-[#f4f7f2]">
      {/* Header */}
      <div className="-mx-3 -mt-3 mb-1 flex items-center gap-2 bg-[#17251f] px-3 py-3 text-white shadow-[0_5px_18px_rgba(16,43,87,0.22)]">
        <button
          type="button"
          onClick={() => {
            if (tab === "deposit" && step > 1) setStep((s) => (s === 3 ? 2 : 1));
            else if (tab !== "overview") {
              setTab("overview");
              router.replace("/wallet?tab=overview");
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
          onClick={() => setHistoryView("requests")}
          className="rounded-full p-2 text-emerald-50/80 hover:bg-white/10"
          aria-label="records"
        >
          <ClipboardList className="h-5 w-5" />
        </button>
        <Link
          href="#support"
          onClick={(event) => {
            event.preventDefault();
            window.dispatchEvent(new Event("taka69:open-support"));
          }}
          className="rounded-full p-2 text-emerald-50/80 hover:bg-white/10"
        >
          <Headphones className="h-5 w-5" />
        </Link>
      </div>

      {/* Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-[#123d2a] via-[#176b4a] to-[#2eaf78] p-4 text-white shadow-[0_12px_28px_rgba(31,91,153,0.2)]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#91a59c]">
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
          { id: "cards", en: "Cards", bn: "কার্ড" },
          { id: "deposit", en: "Deposit", bn: "ডিপোজিট" },
          { id: "withdraw", en: "Withdraw", bn: "উইথড্র" },
          { id: "history", en: "History", bn: "হিস্ট্রি" },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => {
              setTab(tb.id);
              if (tb.id === "deposit") setStep(1);
              router.replace(tb.id === "history" ? "/wallet?tab=history&view=requests" : `/wallet?tab=${tb.id}`);
            }}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold",
              tab === tb.id
                ? "border-[#10b981] bg-[#10b981] text-white shadow-[0_5px_14px_rgba(47,128,197,0.22)]"
                : "border-[#33413f] bg-[#242e36] text-[#a8b8b0]"
            )}
          >
            {t(tb.en, tb.bn)}
          </button>
        ))}
      </div>

      {tab === "cards" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#33413f] bg-[#242e36] p-4 shadow-[0_7px_22px_rgba(48,89,125,0.07)]">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4b3b] text-[#10b981]"><CreditCard className="h-5 w-5" /></div>
              <div><h2 className="text-sm font-black">{t("Add wallet account", "ওয়ালেট অ্যাকাউন্ট যোগ করুন")}</h2><p className="text-[11px] text-[#91a59c]">{t("Bind a payment account for faster withdrawals.", "দ্রুত উত্তোলনের জন্য পেমেন্ট অ্যাকাউন্ট যুক্ত করুন।")}</p></div>
            </div>
            <form onSubmit={addCard} className="space-y-2.5">
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3">
                {configuredMethods.map((m) => (
                  <button key={m.id} type="button" onClick={() => setCardMethod(m.id)} className={cn("flex items-center gap-2 rounded-xl border bg-[#1b242d] px-3 py-2.5 text-left text-xs font-bold", cardMethod === m.id ? "border-[#10b981] ring-1 ring-[#34d399]" : "border-[#33413f]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.logo || PAYMENT_METHODS.find((item) => item.id === m.id)?.logo || "/icons/logo.png"} alt="" className="h-6 w-6 rounded bg-white object-contain" />{m.name}
                  </button>
                ))}
              </div>
              <input value={cardAccountNo} onChange={(e) => setCardAccountNo(e.target.value)} inputMode="numeric" placeholder={t("Wallet number", "ওয়ালেট নম্বর")} required className="w-full rounded-xl border border-[#33413f] bg-[#1b242d] px-3 py-3 text-sm font-semibold text-[#f4f7f2] outline-none placeholder:text-[#71877d] focus:border-[#10b981] focus:bg-[#242e36] focus:ring-4 focus:ring-[#10b981]/15" />
              <input value={cardAccountName} onChange={(e) => setCardAccountName(e.target.value)} placeholder={t("Account name (optional)", "অ্যাকাউন্টের নাম (ঐচ্ছিক)")} className="w-full rounded-xl border border-[#33413f] bg-[#1b242d] px-3 py-3 text-sm text-[#f4f7f2] outline-none placeholder:text-[#71877d] focus:border-[#10b981] focus:bg-[#242e36] focus:ring-4 focus:ring-[#10b981]/15" />
              <button type="submit" disabled={cardSaving || !cardAccountNo.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] py-3 text-sm font-black text-white shadow-[0_7px_18px_rgba(47,128,197,0.2)] disabled:opacity-40"><Plus className="h-4 w-4" />{cardSaving ? t("Adding...", "যোগ হচ্ছে...") : t("Add account", "অ্যাকাউন্ট যোগ করুন")}</button>
            </form>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1"><h2 className="text-sm font-black">{t("Saved accounts", "সংরক্ষিত অ্যাকাউন্ট")}</h2><span className="text-[11px] font-bold text-[#91a59c]">{cards.length}</span></div>
            {cardsLoading && <div className="rounded-2xl border border-[#33413f] bg-[#242e36] p-4 text-center text-xs text-[#91a59c]">{t("Loading cards...", "কার্ড লোড হচ্ছে...")}</div>}
            {!cardsLoading && cardsError && <div className="rounded-2xl border border-rose-400/30 bg-rose-950/20 p-4 text-center text-xs text-rose-200">{cardsError}<button type="button" onClick={loadCards} className="ml-2 font-bold underline">{t("Retry", "আবার চেষ্টা করুন")}</button></div>}
            {!cardsLoading && !cardsError && cards.map((card) => {
              const methodInfo = PAYMENT_METHODS.find((m) => m.id === card.method);
              return <div key={card.id} className="flex items-center gap-3 rounded-2xl border border-[#33413f] bg-[#242e36] p-3 shadow-[0_7px_18px_rgba(48,89,125,0.07)]"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1b242d]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={methodInfo?.logo || "/icons/logo.png"} alt={card.label} className="h-8 w-8 object-contain" /></div><div className="min-w-0 flex-1"><div className="text-sm font-black">{card.label}</div><div className="text-sm font-bold tracking-wide text-[#9ad8bb]">{card.accountNo}</div>{card.accountName && <div className="truncate text-[11px] text-[#91a59c]">{card.accountName}</div>}</div><button type="button" onClick={() => removeCard(card.id)} className="rounded-xl p-2 text-[#fb7185] transition hover:bg-rose-50" aria-label={t("Remove account", "অ্যাকাউন্ট সরান")}><Trash2 className="h-4 w-4" /></button></div>;
            })}
            {!cardsLoading && !cardsError && !cards.length && <div className="rounded-2xl border border-dashed border-[#3a5148] bg-[#242e36] p-6 text-center"><CreditCard className="mx-auto h-8 w-8 text-[#71877d]" /><p className="mt-2 text-sm font-bold text-[#a8b8b0]">{t("No saved accounts yet", "এখনো কোনো অ্যাকাউন্ট সংরক্ষিত নেই")}</p><p className="mt-1 text-[11px] text-[#71877d]">{t("Add one above to use it for withdrawals.", "উত্তোলনে ব্যবহার করতে উপরে একটি অ্যাকাউন্ট যোগ করুন।")}</p></div>}
          </div>
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3">
            <button
              onClick={() => {
                setTab("deposit");
                setStep(1);
                router.replace("/wallet?tab=deposit");
              }}
              className="rounded-2xl bg-[#f3c74f] py-3 text-sm font-black text-[#121426] shadow-[0_10px_22px_rgba(243,199,79,0.18)]"
            >
              {t("Deposit", "ডিপোজিট")}
            </button>
            <button
              onClick={() => {
                setTab("withdraw");
                router.replace("/wallet?tab=withdraw");
              }}
              className="rounded-2xl bg-[#16a34a] py-3 text-sm font-black text-white shadow-[0_10px_22px_rgba(22,163,74,0.2)]"
            >
              {t("Withdraw", "উইথড্র")}
            </button>
          </div>
          <div className="rounded-2xl border border-[#33413f] bg-[#242e36] p-3 text-[#f4f7f2] shadow-[0_7px_22px_rgba(48,89,125,0.07)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t("Recent requests", "সাম্প্রতিক রিকোয়েস্ট")}</span>
              <button
                className="text-[11px] text-[#10b981]"
                onClick={() => setHistoryView("requests")}
              >
                {t("See all", "সব দেখুন")} <ChevronRight className="inline h-3 w-3" />
              </button>
            </div>
            {reqs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-t border-[#33413f] pt-2">
                <div>
                  <div className="font-medium">
                    {r.type} · {r.method}
                  </div>
                  <div className="text-[10px] text-[#91a59c]">{r.status}</div>
                </div>
                <div className="font-bold text-[#10b981]">{formatCoins(r.amount)} BDT</div>
              </div>
            ))}
            {!reqs.length && (
              <p className="text-xs text-[#91a59c]">{t("No requests yet", "এখনো কোনো রিকোয়েস্ট নেই")}</p>
            )}
          </div>
        </div>
      )}

      {/* DEPOSIT multi-step JETA7 style */}
      {tab === "deposit" && (
        <div className="space-y-4">
          {!depositMethods.length ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-5 text-center">
              <p className="text-sm font-black text-amber-100">{t("Deposits are temporarily unavailable", "ডিপোজিট সাময়িকভাবে বন্ধ আছে")}</p>
              <p className="mt-1 text-xs text-amber-100/70">{t("No payment method is configured yet. Please try again later.", "এখনও কোনো পেমেন্ট পদ্ধতি কনফিগার করা হয়নি। পরে আবার চেষ্টা করুন।")}</p>
            </div>
          ) : <>
          {step === 1 && (
            <>
              <div>
                <div className="mb-2 text-sm font-bold text-[#f4f7f2]">
                  · {t("Deposit mode", "আমানতের মোড")}
                </div>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3">
                  {depositMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "relative rounded-xl border-2 bg-[#242e36] p-3 text-center transition",
                        method === m.id ? "border-[#10b981] shadow-md" : "border-transparent"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.logo || `/payments/${m.id}.png`} alt={m.name} className="mx-auto h-8 object-contain" />
                      <div className="mt-1 text-[11px] font-bold text-[#f4f7f2]">{m.name}</div>
                      <div className="text-[10px] font-bold text-[#10b981]">{m.type || t("Available", "চালু")}</div>
                      {method === m.id && (
                        <span className="absolute bottom-1 right-1 text-[#10b981]">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {notice && <p className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-[11px] leading-relaxed text-[#b45309]">{notice}</p>}
                {selectedMethodInstruction && <p className="mt-2 rounded-xl border border-[#33413f] bg-[#1b242d] px-3 py-2 text-[11px] leading-relaxed text-[#cde6d8]">{selectedMethodInstruction}</p>}
                {selectedMethodWarning && <p className="mt-2 rounded-xl border border-rose-400/25 bg-rose-950/20 px-3 py-2 text-[11px] leading-relaxed text-rose-200">{selectedMethodWarning}</p>}
                <p className="mt-2 text-[11px] leading-relaxed text-[#fb7185]">
                  {t(
                    `Please Cash Out via your ${selectedPaymentMethod?.name || method} account and paste the correct TrxID on the payment page. Wrong TrxID = failed deposit.`,
                    `অনুগ্রহ করে আপনার (${method === "nagad" ? "Nagad" : method}) অ্যাকাউন্টের মাধ্যমে অর্থ স্থানান্তর করুন এবং পেমেন্ট পাতায় TRX ID সঠিকভাবে পূরণ করুন। ⚠️ ভুল TRX ID হলে লেনদেন সফল হবে না।`
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#f4f7f2]">
                  · {t("Payment channel", "পেমেন্ট চ্যানেল")}
                </div>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3">
                  {channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChannel(c.id)}
                      className={cn(
                        "relative rounded-xl border bg-[#242e36] px-2 py-3 text-left text-[12px] font-semibold text-[#f4f7f2]",
                        channel === c.id ? "border-[#10b981] ring-1 ring-[#34d399]" : "border-[#33413f]"
                      )}
                    >
                      <span className="absolute right-1 top-1 rounded bg-[#10b981] px-1 text-[9px] font-black text-white">
                        {c.bonus}
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#fb7185]">
                  {t(
                    "Always use the latest account. Wrong transfer account cannot be refunded.",
                    "প্রতিটি জমার সময় সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। ভুল অ্যাকাউন্টে ট্রান্সফার করলে অর্থ ফেরত পাওয়া যাবে না।"
                  )}
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#f4f7f2]">
                  · {t("Deposit amount", "জমা পরিমাণ")}
                </div>
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 min-[700px]:grid-cols-4">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a)}
                      className={cn(
                        "relative rounded-xl border bg-[#242e36] py-2.5 text-sm font-bold text-[#f4f7f2]",
                        amount === a ? "border-[#10b981] text-[#10b981]" : "border-[#33413f]"
                      )}
                    >
                      {a.toLocaleString()}
                      {amount === a && (
                        <span className="absolute bottom-0 right-0 h-0 w-0 border-b-[14px] border-l-[14px] border-b-[#10b981] border-l-transparent" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-2.5 text-sm text-[#f4f7f2]">
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
                <div className="mt-1 text-[10px] text-[#91a59c]">
                  {minDep} - {maxDep.toLocaleString()} BDT
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-[#f4f7f2]">· {t("Promo", "কার্যক্রম")}</div>
                <label className="flex items-center gap-2 rounded-xl border border-[#33413f] bg-[#1b242d] px-3 py-3 text-sm">
                  <input
                    type="radio"
                    checked={promoNone}
                    onChange={() => setPromoNone(true)}
                    className="accent-rose-500"
                  />
                  {t("Do not participate in any promo", "কোনও প্রচারে অংশ নেওয়া যায় না")}
                </label>
              </div>

              {!depositMethods.length && <p className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-200">{t("No deposit method is currently available.", "এই মুহূর্তে কোনো ডিপোজিট পদ্ধতি চালু নেই।")}</p>}
              <button
                type="button"
                disabled={!depositMethods.length}
                onClick={() => {
                  if (amount < minDep) {
                    toast.error(`Min ${minDep} BDT`);
                    return;
                  }
                  setStep(2);
                }}
                className="w-full rounded-xl bg-[#f3c74f] py-3.5 text-sm font-black text-[#121426] shadow-[0_10px_22px_rgba(243,199,79,0.18)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("Next", "পরবর্তী")}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-xl bg-[#17251f] text-white px-3 py-2 text-sm font-bold flex justify-between">
                <span>
                  BDT {amount.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold opacity-80">PAY SERVICE</span>
              </div>
              <p className="text-[12px] font-semibold text-[#fb7185] leading-snug">
                {t(
                  `If you change the amount (BDT ${amount.toFixed(2)}), you will not receive credit.`,
                  `আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (BDT ${amount.toFixed(2)}), আপনি ক্রেডিট পেতে সক্ষম হবেন না।`
                )}
              </p>

              <div className="rounded-xl bg-[#10b981] px-4 py-3 text-white font-black flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPaymentMethod?.logo || `/payments/${selectedPaymentMethod?.id || method}.png`} alt="" className="h-8 w-8 rounded bg-white object-contain p-0.5" />
                {selectedPaymentMethod?.name || method.toUpperCase()} Deposit
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#f4f7f2]">
                  Wallet No<span className="text-[#fb7185]">*</span>
                </div>
                <p className="text-[11px] text-[#f4f7f2]/50">
                  {selectedPaymentMethod?.name || method.toUpperCase()} {t("receive account", "রিসিভ অ্যাকাউন্ট")}
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-[#242e36] px-3 py-3 text-[#f4f7f2] shadow-sm font-bold">
                  <span className="flex-1 tracking-wide">{selectedPaymentMethod?.number || t("Not configured", "কনফিগার করা নেই")}</span>
                  <button
                    type="button"
                    disabled={!selectedPaymentMethod?.number}
                    onClick={() => {
                      if (selectedPaymentMethod?.number) copyText(selectedPaymentMethod.number);
                    }}
                    className="rounded-lg bg-[#10b981] p-2 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#f4f7f2]">
                  {t("Cash-out TrxID (required)", "ক্যাশআউটের TrxID নাম্বারটি লিখুন(প্রয়োজন)")}
                  <span className="text-[#fb7185]">*</span>
                </div>
                <button
                  type="button"
                  className="text-[12px] text-[#10b981] underline"
                  onClick={() =>
                    toast.success(
                      t("Tip", "টিপস"),
                      t(
                        "After Cash Out, open transaction details and copy Transaction ID.",
                        "ক্যাশ আউট করার পর ট্রানজেকশন ডিটেইলস খুলে Transaction ID কপি করুন।"
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
                    "w-full rounded-xl border-2 bg-[#242e36] px-3 py-3 text-sm font-bold text-[#f4f7f2] outline-none",
                    !trxId ? "border-rose-500" : "border-emerald-500"
                  )}
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-[#f4f7f2]">
                  {t("Screenshot (optional)", "স্ক্রিনশট (ঐচ্ছিক)")}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickScreenshot(e.target.files?.[0])}
                  className="block w-full text-xs text-[#f4f7f2]/70"
                />
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="mt-1 max-h-32 rounded-lg border border-[#33413f]" />
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-[#fb7185]">
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
                  className="flex-1 rounded-xl border border-[#3a5148] py-3 text-sm font-bold text-[#f4f7f2]"
                >
                  {t("Back", "পিছনে")}
                </button>
                <button
                  type="button"
                  disabled={!trxId.trim()}
                  onClick={() => setConfirmOpen(true)}
                  className="flex-[2] rounded-xl bg-[#f3c74f] py-3 text-sm font-black text-[#121426] disabled:opacity-40"
                >
                  {t("Confirm", "নিশ্চিত")}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4 rounded-2xl border border-emerald-400/30 bg-[#17251f] p-5 text-center shadow-[0_12px_26px_rgba(16,185,129,0.12)]">
              <CheckCircle2 className="mx-auto h-14 w-14 text-[#34d399]" />
              <div>
                <h2 className="text-lg font-black text-white">{t("Deposit submitted", "ডিপোজিট জমা হয়েছে")}</h2>
                <p className="mt-1 text-xs leading-relaxed text-emerald-50/70">{t("Your request is pending admin review. You can track the status from deposit records.", "আপনার রিকোয়েস্ট অ্যাডমিন রিভিউ করছেন। জমা রেকর্ড থেকে স্ট্যাটাস দেখুন।")}</p>
              </div>
              {submittedRequest && (
                <div className="rounded-xl bg-black/20 p-3 text-left text-xs text-emerald-50/80">
                  <div className="flex justify-between"><span>{t("Reference", "রেফারেন্স")}</span><strong className="text-white">{submittedRequest.id.slice(-12)}</strong></div>
                  <div className="mt-1 flex justify-between"><span>{t("Amount", "পরিমাণ")}</span><strong className="text-white">৳ {formatCoins(submittedRequest.amount)}</strong></div>
                  {submittedRequest.trxId && <div className="mt-1 flex justify-between gap-3"><span>TrxID</span><strong className="truncate text-white">{submittedRequest.trxId}</strong></div>}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setStep(1); setSubmittedRequest(null); }} className="flex-1 rounded-xl border border-emerald-300/30 py-3 text-sm font-bold text-white">{t("New deposit", "নতুন ডিপোজিট")}</button>
                <button type="button" onClick={() => { setTab("history"); setHistoryView("requests"); }} className="flex-1 rounded-xl bg-[#f3c74f] py-3 text-sm font-black text-[#121426]">{t("View records", "রেকর্ড দেখুন")}</button>
              </div>
            </div>
          )}

          {confirmOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-2xl border border-[#3a5148] bg-[#242e36] p-5 text-[#f4f7f2] shadow-2xl">
                <p className="text-sm leading-relaxed">
                  {t(
                    "This order can only be submitted once, please confirm your Transaction ID:",
                    "This order can only be submitted once, please confirm your Transaction ID:"
                  )}
                </p>
                <p className="mt-2 text-center text-lg font-black text-[#fb7185]">{trxId}</p>
                <p className="text-center text-sm">is correct!</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 rounded-full bg-[#1d4b3b] py-2.5 text-sm font-bold text-[#a8c2b3]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submit("DEPOSIT")}
                    className="flex-1 rounded-full bg-emerald-700 py-2.5 text-sm font-bold text-[#f4f7f2]"
                  >
                    {loading ? "..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {msg && <p className="text-sm text-[#fb7185]">{msg}</p>}
          </>}
        </div>
      )}

      {tab === "withdraw" && (
        <div className="space-y-3">
          <p className="text-[12px] text-[#f4f7f2]/50">
            {t(`Minimum withdraw ${minWd} BDT`, `সর্বনিম্ন উত্তোলন ${minWd} BDT`)}
          </p>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 min-[700px]:grid-cols-3">
            {withdrawMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-xl border border-[#33413f] bg-[#242e36] p-2",
                  method === m.id ? "border-[#10b981]" : "border-transparent"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo || `/payments/${m.id}.png`} alt={m.name} className="mx-auto h-7 object-contain" />
                <div className="text-[10px] font-bold text-[#f4f7f2] text-center">{m.name}</div>
              </button>
            ))}
          </div>
          {!withdrawMethods.length && <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-3 py-3 text-xs text-rose-200">{t("No withdrawal method is currently available.", "এই মুহূর্তে কোনো উত্তোলন পদ্ধতি চালু নেই।")}</div>}
          <p className="text-[12px] text-[#f4f7f2]/50">
            {t(`Maximum withdraw ${maxWd} BDT`, `সর্বোচ্চ উত্তোলন ${maxWd} BDT`)}
          </p>
          {cardsLoading ? (
            <div className="rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-4 text-center text-xs text-[#91a59c]">{t("Loading saved accounts...", "সংরক্ষিত অ্যাকাউন্ট লোড হচ্ছে...")}</div>
          ) : cardsError ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-3 py-3 text-xs text-rose-200">{cardsError}<button type="button" onClick={loadCards} className="ml-2 font-bold underline">{t("Retry", "আবার চেষ্টা করুন")}</button></div>
          ) : withdrawCards.length ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#a8b8b0]">{t("Choose a bound wallet", "বাঁধা ওয়ালেট বেছে নিন")}</div>
              {withdrawCards.map((card) => (
                <button key={card.id} type="button" onClick={() => { setSelectedCardId(card.id); setAccountName(card.accountName || ""); }} className={cn("flex w-full items-center gap-3 rounded-xl border bg-[#242e36] px-3 py-3 text-left", selectedCardId === card.id ? "border-[#10b981] ring-1 ring-[#34d399]" : "border-[#33413f]")}>
                  <CreditCard className="h-5 w-5 shrink-0 text-[#10b981]" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-black">{card.label}</span><span className="block text-xs font-bold tracking-wide text-[#9ad8bb]">{card.accountNo}</span>{card.accountName && <span className="block truncate text-[11px] text-[#91a59c]">{card.accountName}</span>}{card.status && card.status !== "ACTIVE" && <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">{card.status}</span>}</span>
                  {selectedCardId === card.id && <CheckCircle2 className="h-5 w-5 text-[#10b981]" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#3a5148] bg-[#242e36] px-3 py-4 text-center"><p className="text-sm font-bold text-[#a8b8b0]">{t("Bind a wallet account before withdrawing", "উত্তোলনের আগে একটি ওয়ালেট অ্যাকাউন্ট বাঁধুন")}</p><button type="button" onClick={() => { setTab("cards"); router.replace("/wallet?tab=cards"); }} className="mt-2 rounded-lg bg-[#f3c74f] px-3 py-2 text-xs font-black text-[#121426]">{t("Bind account", "অ্যাকাউন্ট বাঁধুন")}</button></div>
          )}
          {selectedCard && !selectedCard.accountName && <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={t("Account holder full name", "প্রাপকের পূর্ণ নাম লিখুন")} className="w-full rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-3 text-sm text-[#f4f7f2] outline-none placeholder:text-[#71877d]" />}
          {!hasTransactionPassword ? (
            <Link href="/profile/settings?section=transaction-password" className="block rounded-xl border border-amber-300/30 bg-amber-950/20 px-3 py-3 text-xs text-amber-100">
              {t("Set a transaction password before withdrawing", "উত্তোলনের আগে লেনদেন পাসওয়ার্ড সেট করুন")}
            </Link>
          ) : (
            <input type="password" value={transactionPassword} onChange={(e) => setTransactionPassword(e.target.value)} placeholder={t("Transaction password", "লেনদেন পাসওয়ার্ড")} className="w-full rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-3 text-sm text-[#f4f7f2] outline-none placeholder:text-[#71877d]" />
          )}
          <input
            type="number"
            value={amount}
            min={minWd}
            max={maxWd}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            placeholder="Amount"
            className="w-full rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-3 text-sm text-[#f4f7f2] outline-none placeholder:text-[#71877d]"
          />
          <button
            type="button"
            disabled={loading || !selectedCardId || !selectedCard || selectedCard.status === "REJECTED" || selectedCard.status === "BLOCKED" || (!selectedCard.accountName && accountName.trim().length < 2) || amount < minWd || amount > maxWd || !withdrawMethods.length || !hasTransactionPassword || !transactionPassword.trim()}
            onClick={() => submit("WITHDRAW")}
            className="w-full rounded-xl bg-[#16a34a] py-3.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(22,163,74,0.2)] disabled:opacity-40"
          >
            {loading ? "..." : t("Submit withdraw", "উত্তোলন জমা দিন")}
          </button>
          {msg && <p className="text-sm text-[#fb7185]">{msg}</p>}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {historyLoading && <div className="rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-4 text-center text-xs text-[#91a59c]">{t("Loading wallet history...", "ওয়ালেট ইতিহাস লোড হচ্ছে...")}</div>}
          {!historyLoading && historyError && <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 px-3 py-3 text-xs text-rose-200">{historyError}<button type="button" onClick={load} className="ml-2 font-bold underline">{t("Retry", "আবার চেষ্টা করুন")}</button></div>}
          <div className="flex gap-2">
            {[
              { id: "requests", en: "Requests", bn: "রিকোয়েস্ট" },
              { id: "money", en: "Money", bn: "মানি" },
              { id: "bets", en: "Bets", bn: "বেট" },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setHistoryView(h.id as typeof histTab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold border",
                  histTab === h.id
                    ? "bg-emerald-500 text-[#f4f7f2] border-emerald-400"
                    : "border-[#3a5148] text-[#a8b8b0]"
                )}
              >
                {t(h.en, h.bn)}
              </button>
            ))}
          </div>

          {histTab === "money" && (moneyTx.length ? moneyTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-2 text-sm text-[#f4f7f2] shadow-sm"
              >
                <div>
                  <div className="font-medium">{tx.type}</div>
                  <div className="text-[10px] text-[#91a59c]">
                    {tx.note || new Date(tx.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={tx.amount >= 0 ? "text-[#34d399] font-bold" : "text-[#fb7185] font-bold"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCoins(tx.amount)} BDT
                </div>
              </div>
            )) : <div className="rounded-xl border border-dashed border-[#3a5148] bg-[#242e36] px-3 py-5 text-center text-xs text-[#91a59c]">{t("No money records yet", "এখনো কোনো মানি রেকর্ড নেই")}</div>)}

          {histTab === "bets" && (bets.length ? bets.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-[#33413f] bg-[#242e36] px-3 py-2 text-sm text-[#f4f7f2] shadow-sm"
              >
                <div>
                  <div className="font-medium">{b.gameType}</div>
                  <div className="text-[10px] text-[#91a59c]">
                    {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#91a59c]">-{formatCoins(b.amount)} BDT</div>
                  <div className={b.won ? "text-[#34d399] font-bold" : "text-[#fb7185] font-bold"}>
                    {b.won ? `+${formatCoins(b.payout)} BDT` : t("Lose", "হার")}
                    {b.multiplier ? ` · ${b.multiplier}x` : ""}
                  </div>
                </div>
              </div>
            )) : <div className="rounded-xl border border-dashed border-[#3a5148] bg-[#242e36] px-3 py-5 text-center text-xs text-[#91a59c]">{t("No betting records yet", "এখনো কোনো বেটিং রেকর্ড নেই")}</div>)}

          {histTab === "requests" && (reqs.length ? reqs.map((r) => (
              <div key={r.id} className="rounded-xl border border-[#33413f] bg-[#242e36] text-[#f4f7f2] px-3 py-3 text-sm space-y-1 shadow-[0_7px_18px_rgba(48,89,125,0.08)]">
                <div className="font-bold uppercase">{r.method}</div>
                <div className="text-[11px] text-[#91a59c]">{new Date(r.createdAt).toLocaleString()}</div>
                <div className="rounded-lg bg-[#1b242d] p-2 text-[12px] space-y-1">
                  <div>
                    {t("Ref#", "জমা রেফ#")}: {r.id.slice(-12)}
                  </div>
                  {r.trxId && <div>TrxID: {r.trxId}</div>}
                  <div className="flex justify-between pt-1 border-t border-[#33413f]">
                    <span className="text-[#fb7185] font-bold">{Number(r.amount).toFixed(2)}</span>
                    <span className="text-[#91a59c]">{r.status}</span>
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
            )) : <div className="rounded-xl border border-dashed border-[#3a5148] bg-[#242e36] px-3 py-5 text-center text-xs text-[#91a59c]">{t("No wallet requests yet", "এখনো কোনো ওয়ালেট রিকোয়েস্ট নেই")}</div>)}
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-4 text-[#91a59c]">Loading…</div>}>
      <WalletInner />
    </Suspense>
  );
}
