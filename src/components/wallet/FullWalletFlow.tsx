"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { formatCoins } from "@/lib/utils";
import { ArrowLeft, Check, CheckCircle2, ClipboardList, Copy, CreditCard, Headphones, Info, Plus, ShieldCheck, Trash2, Upload, WalletCards, X } from "lucide-react";

type Method = {
  id: string;
  name: string;
  number?: string;
  logo?: string;
  color?: string;
  type?: string;
  enabled?: boolean;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  instructionsEn?: string;
  instructionsBn?: string;
  warningEn?: string;
  warningBn?: string;
  feeType?: "NONE" | "FIXED" | "PERCENT";
  feeValue?: number;
  channels?: { id: string; label: string; bonus?: number }[];
};

type WalletCard = {
  id: string;
  method: string;
  label: string;
  accountNo: string;
  accountName?: string | null;
  status?: string;
  rejectionReason?: string | null;
  createdAt: string;
};

type RequestRow = {
  id: string;
  type: string;
  method: string;
  channel?: string | null;
  amount: number;
  grossAmount?: number | null;
  feeAmount?: number;
  netAmount?: number | null;
  status: string;
  trxId?: string | null;
  screenshotUrl?: string | null;
  bonusAmount?: number;
  rejectionReason?: string | null;
  adminNote?: string | null;
  note?: string | null;
  createdAt: string;
};

type TxRow = { id: string; type: string; amount: number; balanceAfter: number; note?: string | null; method?: string | null; reference?: string | null; status?: string | null; createdAt: string };
type BetRow = { id: string; gameType: string; amount: number; payout: number; multiplier?: number | null; won: boolean; createdAt: string };

type View = "overview" | "deposit" | "withdraw" | "bind" | "cards" | "history";
type HistoryView = "requests" | "money" | "bets";
type DepositStage = "amount" | "details" | "success";
type WithdrawStage = "form" | "success";

const localLogos: Record<string, string> = {
  bkash: "/payments/bkash.png",
  nagad: "/payments/nagad.png",
  rocket: "/payments/rocket.png",
  upay: "/payments/upay.png",
};

const quickAmounts = [100, 300, 500, 1000, 3000, 5000, 10000, 25000];

function makeKey(type: string, userId?: string) {
  return `${type}-${userId || "user"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getLocalLogo(method: Method | { id: string; logo?: string }) {
  return method.logo || localLogos[method.id.toLowerCase()] || "/icons/logo.png";
}

function PaymentLogo({ method, size = 46 }: { method: Method | { id: string; name?: string; logo?: string }; size?: number }) {
  const [src, setSrc] = useState(getLocalLogo(method));
  const fallback = localLogos[method.id.toLowerCase()] || "/icons/logo.png";
  return <img src={src} alt={method.name || method.id} width={size} height={size} onError={() => { if (src !== fallback) setSrc(fallback); }} style={{ width: size, height: size, objectFit: "contain", borderRadius: 10, background: "#fff" }} />;
}

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" onClick={onClose} style={overlayStyle}><div onClick={(event) => event.stopPropagation()} style={modalStyle}>{children}</div></div>;
}

function Header({ title, onBack, onRecords, onSupport }: { title: string; onBack: () => void; onRecords: () => void; onSupport: () => void }) {
  return <header style={headerStyle}><button type="button" onClick={onBack} style={iconButton} aria-label="Back"><ArrowLeft size={21} /></button><h1 style={{ margin: 0, flex: 1, textAlign: "center", fontSize: 18, fontWeight: 900 }}>{title}</h1><div style={{ display: "flex", gap: 4 }}><button type="button" onClick={onRecords} style={iconButton} aria-label="Records"><ClipboardList size={19} /></button><button type="button" onClick={onSupport} style={iconButton} aria-label="Support"><Headphones size={19} /></button></div></header>;
}

function BottomNav({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  const items: Array<[View, string]> = [["overview", "ওয়ালেট"], ["deposit", "জমা"], ["withdraw", "উতোলন"], ["cards", "কার্ড"], ["history", "রেকর্ড"]];
  return <nav style={bottomNavStyle}>{items.map(([view, label]) => <button type="button" key={view} onClick={() => onChange(view)} style={{ ...bottomButton, color: active === view ? "#c0392b" : "#777", fontWeight: active === view ? 900 : 600 }}><span style={{ fontSize: 18 }}>{view === "overview" ? "◉" : view === "deposit" ? "＋" : view === "withdraw" ? "−" : view === "cards" ? "▣" : "☷"}</span><span>{label}</span></button>)}</nav>;
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) { return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 9px" }}><h2 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>{children}</h2>{action}</div>; }
function MethodTile({ method, selected, onClick }: { method: Method; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} style={{ ...methodTileStyle, borderColor: selected ? "#c0392b" : "#e5e5e5", background: selected ? "#fff7f7" : "#fff", color: selected ? "#c0392b" : "#333" }}><PaymentLogo method={method} size={42} /><span style={{ fontSize: 12, fontWeight: 800 }}>{method.name}</span>{selected && <CheckCircle2 size={16} />}</button>; }
function Pill({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} style={{ ...pillStyle, background: active ? "#c0392b" : "#f2f2f2", color: active ? "#fff" : "#555" }}>{children}</button>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label style={fieldLabel}>{label}{children}</label>; }
function Empty({ children }: { children: ReactNode }) { return <div style={emptyStyle}>{children}</div>; }

function WalletFlowInner({ forcedView }: { forcedView?: View }) {
  const user = useAuthStore((state) => state.user);
  const setBalance = useAuthStore((state) => state.setBalance);
  const t = useLang((state) => state.t);
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryView = searchParams.get("tab");
  const initialHistory = searchParams.get("view");
  const [view, setView] = useState<View>(forcedView || (queryView === "deposit" || queryView === "withdraw" || queryView === "cards" || queryView === "history" || queryView === "bind" ? queryView : "overview") as View);
  const [historyView, setHistoryView] = useState<HistoryView>(initialHistory === "money" || initialHistory === "bets" ? initialHistory : "requests");
  const [methods, setMethods] = useState<Method[]>([]);
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [minDeposit, setMinDeposit] = useState(100);
  const [maxDeposit, setMaxDeposit] = useState(100000);
  const [minWithdraw, setMinWithdraw] = useState(200);
  const [maxWithdraw, setMaxWithdraw] = useState(50000);
  const [notice, setNotice] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [channel, setChannel] = useState("");
  const [amount, setAmount] = useState(500);
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [depositStage, setDepositStage] = useState<DepositStage>("amount");
  const [depositResult, setDepositResult] = useState<RequestRow | null>(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [hasTransactionPassword, setHasTransactionPassword] = useState<boolean | null>(null);
  const [withdrawStage, setWithdrawStage] = useState<WithdrawStage>("form");
  const [withdrawResult, setWithdrawResult] = useState<RequestRow | null>(null);
  const [bindMethod, setBindMethod] = useState("");
  const [bindName, setBindName] = useState("");
  const [bindNumber, setBindNumber] = useState("");
  const [bindSuccess, setBindSuccess] = useState(false);

  const depositMethods = useMemo(() => methods.filter((method) => method.depositEnabled !== false), [methods]);
  const withdrawMethods = useMemo(() => methods.filter((method) => method.withdrawEnabled !== false), [methods]);
  const selectedDeposit = depositMethods.find((method) => method.id === depositMethod) || depositMethods[0];
  const selectedWithdraw = withdrawMethods.find((method) => method.id === withdrawMethod) || withdrawMethods[0];
  const channels = selectedDeposit?.channels?.length ? selectedDeposit.channels : [{ id: "standard", label: "Standard channel", bonus: 0 }];
  const usableCards = cards.filter((card) => card.status === "ACTIVE" || card.status === "VERIFIED");
  const selectedCard = usableCards.find((card) => card.id === selectedCardId);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const [walletJson, requestJson, cardJson, securityJson] = await Promise.all([
        fetch("/api/wallet?tab=all", { credentials: "include" }).then((response) => response.json()),
        fetch("/api/wallet/request", { credentials: "include" }).then((response) => response.json()),
        fetch("/api/wallet/cards", { credentials: "include" }).then((response) => response.json()),
        fetch("/api/security/transaction-password", { credentials: "include" }).then((response) => response.json()),
      ]);
      if (walletJson.ok) { setTransactions(walletJson.data?.transactions || []); setBets(walletJson.data?.bets || []); if (typeof walletJson.data?.balance === "number") setBalance(walletJson.data.balance); }
      if (requestJson.ok) {
        setRequests(requestJson.data?.requests || []);
        const config = requestJson.data?.paymentConfig || {};
        const configured = Array.isArray(config.methods) ? config.methods.filter((method: Method) => method && method.enabled !== false && method.id && method.name) : [];
        setMethods(configured);
        setMinDeposit(Number(config.minDeposit || 100)); setMaxDeposit(Number(config.maxDeposit || 100000));
        setMinWithdraw(Number(config.minWithdraw || 200)); setMaxWithdraw(Number(config.maxWithdraw || 50000));
        setNotice(t(String(config.noticeEn || ""), String(config.noticeBn || "")));
      }
      if (cardJson.ok) setCards(cardJson.data?.cards || []);
      if (securityJson.ok) setHasTransactionPassword(Boolean(securityJson.data?.hasTransactionPassword));
    } catch { setError(t("Could not load wallet", "ওয়ালেট লোড করা যায়নি")); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);
  useEffect(() => {
    if (forcedView) setView(forcedView);
    else if (["deposit", "withdraw", "cards", "history", "bind"].includes(queryView || "")) setView(queryView as View);
    if (initialHistory === "money" || initialHistory === "bets" || initialHistory === "requests") setHistoryView(initialHistory);
  }, [forcedView, queryView, initialHistory]);
  useEffect(() => { if (depositMethods.length && !depositMethods.some((method) => method.id === depositMethod)) setDepositMethod(depositMethods[0].id); }, [depositMethods, depositMethod]);
  useEffect(() => { if (withdrawMethods.length && !withdrawMethods.some((method) => method.id === withdrawMethod)) setWithdrawMethod(withdrawMethods[0].id); }, [withdrawMethods, withdrawMethod]);
  useEffect(() => { if (channels.length && !channels.some((item) => item.id === channel)) setChannel(channels[0].id); }, [channels, channel]);
  useEffect(() => { if (!selectedCard && usableCards[0]) setSelectedCardId(usableCards[0].id); }, [selectedCard, usableCards]);
  useEffect(() => { if (withdrawMethods.length && !bindMethod) setBindMethod(withdrawMethods[0].id); }, [withdrawMethods, bindMethod]);

  function navigate(next: View) {
    setView(next);
    if (next === "deposit") { setDepositStage("amount"); setDepositResult(null); }
    if (next === "withdraw") { setWithdrawStage("form"); setWithdrawResult(null); }
    if (next === "bind") setBindSuccess(false);
    router.replace(next === "history" ? `/wallet?tab=history&view=${historyView}` : `/wallet?tab=${next}`);
  }
  function back() { if (view === "overview") router.push("/"); else navigate("overview"); }
  function support() { window.dispatchEvent(new Event("taka69:open-support")); }
  function copy(text: string) { navigator.clipboard?.writeText(text).then(() => toast.success(t("Copied", "কপি হয়েছে"))).catch(() => toast.error(t("Copy failed", "কপি করা যায়নি"))); }
  function setHistory(next: HistoryView) { setHistoryView(next); router.replace(`/wallet?tab=history&view=${next}`); }

  async function pickScreenshot(file?: File | null) {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) { toast.error(t("Maximum screenshot size is 2.5MB", "স্ক্রিনশট সর্বোচ্চ ২.৫MB হতে পারে")); return; }
    const data = await fileToDataUrl(file); setScreenshot(data); setPreviewOpen(true);
  }

  function validateDeposit() {
    if (!selectedDeposit) return t("Choose a payment method", "পেমেন্ট পদ্ধতি নির্বাচন করুন");
    if (amount < minDeposit || amount > maxDeposit) return t(`Amount must be between ${minDeposit} and ${maxDeposit}`, `${minDeposit} থেকে ${maxDeposit} টাকার মধ্যে পরিমাণ দিন`);
    return "";
  }
  function validateDetails() {
    const base = validateDeposit();
    if (base) return base;
    if (!trxId.trim()) return t("TrxID is required", "TrxID লিখুন");
    return "";
  }
  function nextDeposit() {
    const problem = depositStage === "amount" ? validateDeposit() : validateDetails();
    if (problem) { setError(problem); toast.error(problem); return; }
    setError("");
    if (depositStage === "amount") setDepositStage("details"); else setConfirmOpen(true);
  }

  async function submitDeposit() {
    if (!user || !selectedDeposit) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/wallet/request", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "DEPOSIT", method: selectedDeposit.id, channel, amount, trxId: trxId.trim(), screenshot: screenshot || undefined, idempotencyKey: makeKey("DEPOSIT", user.id) }) });
      const json = await response.json();
      if (!json.ok) { setError(json.error || t("Deposit could not be submitted", "ডিপোজিট জমা দেওয়া যায়নি")); toast.error(json.error || "ডিপোজিট জমা দেওয়া যায়নি"); return; }
      setDepositResult(json.data?.request || null); setConfirmOpen(false); setDepositStage("success"); setTrxId(""); setScreenshot(""); await loadAll(); toast.success(t("Deposit request submitted", "ডিপোজিট রিকোয়েস্ট জমা হয়েছে"));
    } catch { setError(t("Network error", "নেটওয়ার্ক সমস্যা")); }
    finally { setBusy(false); }
  }

  function reviewWithdraw() {
    if (!user || !selectedWithdraw || !selectedCard) { setError(t("Choose an active wallet account", "একটি সক্রিয় ওয়ালেট নির্বাচন করুন")); return; }
    if (!hasTransactionPassword) { setError(t("Set a transaction password first", "আগে লেনদেন পাসওয়ার্ড সেট করুন")); return; }
    if (amount < minWithdraw || amount > maxWithdraw) { setError(`${minWithdraw} - ${maxWithdraw} TK`); return; }
    if (!transactionPassword) { setError(t("Enter transaction password", "লেনদেন পাসওয়ার্ড লিখুন")); return; }
    setError("");
    setConfirmOpen(true);
  }

  async function submitWithdraw() {
    if (!user || !selectedWithdraw || !selectedCard) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/wallet/request", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "WITHDRAW", method: selectedWithdraw.id, amount, cardId: selectedCard.id, transactionPassword, idempotencyKey: makeKey("WITHDRAW", user.id) }) });
      const json = await response.json();
      if (!json.ok) { setError(json.error || t("Withdrawal could not be submitted", "উত্তোলন জমা দেওয়া যায়নি")); return; }
      setConfirmOpen(false); setWithdrawResult(json.data?.request || null); setWithdrawStage("success"); setTransactionPassword(""); if (typeof json.data?.balance === "number") setBalance(json.data.balance); await loadAll(); toast.success(t("Withdrawal request submitted", "উত্তোলন রিকোয়েস্ট জমা হয়েছে"));
    } catch { setError(t("Network error", "নেটওয়ার্ক সমস্যা")); }
    finally { setBusy(false); }
  }

  async function addBind(event: React.FormEvent) {
    event.preventDefault();
    if (!bindMethod || !bindName.trim() || !bindNumber.trim()) { setError(t("Complete all wallet fields", "সব ওয়ালেট তথ্য পূরণ করুন")); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/wallet/cards", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ method: bindMethod, accountName: bindName.trim(), accountNo: bindNumber.trim() }) });
      const json = await response.json();
      if (!json.ok) { setError(json.error || t("Wallet could not be added", "ওয়ালেট যোগ করা যায়নি")); return; }
      setCards((current) => [json.data.card, ...current]); setBindName(""); setBindNumber(""); setBindSuccess(true); toast.success(t("Wallet added", "ওয়ালেট সফলভাবে যোগ হয়েছে"));
    } catch { setError(t("Network error", "নেটওয়ার্ক সমস্যা")); }
    finally { setBusy(false); }
  }

  async function removeCard(id: string) {
    const response = await fetch(`/api/wallet/cards?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
    const json = await response.json();
    if (!json.ok) { toast.error(json.error || t("Could not remove wallet", "ওয়ালেট সরানো যায়নি")); return; }
    setCards((current) => current.filter((card) => card.id !== id)); toast.success(t("Wallet removed", "ওয়ালেট সরানো হয়েছে"));
  }

  if (!user) return <div style={{ ...pageStyle, padding: 28, textAlign: "center" }}><WalletCards size={44} color="#c0392b" /><h2 style={{ margin: "14px 0 7px" }}>{t("Login to open wallet", "ওয়ালেট খুলতে লগইন করুন")}</h2><Link href="/login" style={primaryButton}>{t("Login", "লগইন")}</Link></div>;

  const title = view === "overview" ? "ওয়ালেট" : view === "deposit" ? "জমা দিন" : view === "withdraw" ? "উতোলন" : view === "bind" ? "ই-ওয়ালেট বাঁধুন" : view === "cards" ? "আমার কার্ড" : "রেকর্ড";
  const methodForCard = (card: WalletCard) => methods.find((method) => method.id === card.method) || { id: card.method, name: card.label };

  return <div style={pageStyle}>
    <Header title={title} onBack={back} onRecords={() => navigate("history")} onSupport={support} />
    <main style={{ padding: "0 14px 92px" }}>
      <section style={balanceCard}><div style={{ color: "#b8e9d3", fontSize: 11, letterSpacing: 1.5 }}>CURRENT BALANCE</div><strong style={{ display: "block", fontSize: 31, marginTop: 4 }}>৳ {formatCoins(user.balance)}</strong><div style={{ marginTop: 12, display: "flex", gap: 8 }}><button type="button" onClick={() => navigate("deposit")} style={{ ...roundAction, background: "#f3c74f", color: "#1b1b1b" }}>＋ জমা</button><button type="button" onClick={() => navigate("withdraw")} style={{ ...roundAction, background: "#1dbf73", color: "#fff" }}>− উতোলন</button></div></section>
      {notice && <button type="button" onClick={() => setInfoOpen(true)} style={noticeStyle}><Info size={16} />{notice}<span style={{ marginLeft: "auto" }}>›</span></button>}

      {view === "overview" && <>
        <SectionTitle action={<button type="button" onClick={() => navigate("history")} style={linkButton}>সব দেখুন ›</button>}>সাম্প্রতিক রিকোয়েস্ট</SectionTitle>
        <section style={panelStyle}>{loading ? <Empty>লোড হচ্ছে…</Empty> : requests.slice(0, 5).length ? requests.slice(0, 5).map((row) => <RecordRow key={row.id} row={row} />) : <Empty>এখনো কোনো রিকোয়েস্ট নেই</Empty>}</section>
        <SectionTitle>দ্রুত কাজ</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}><button type="button" onClick={() => navigate("bind")} style={quickTile}><Plus size={22} color="#c0392b" /><b>ই-ওয়ালেট বাঁধুন</b><small>উত্তোলনের জন্য</small></button><button type="button" onClick={() => navigate("cards")} style={quickTile}><CreditCard size={22} color="#c0392b" /><b>আমার কার্ড</b><small>{cards.length}টি সংরক্ষিত</small></button><button type="button" onClick={() => setHistory("money")} style={quickTile}><ClipboardList size={22} color="#c0392b" /><b>মানি রেকর্ড</b><small>লেনদেন দেখুন</small></button><button type="button" onClick={() => setInfoOpen(true)} style={quickTile}><ShieldCheck size={22} color="#c0392b" /><b>পেমেন্ট নিরাপত্তা</b><small>নির্দেশনা দেখুন</small></button></div>
      </>}

      {view === "deposit" && <DepositFlow stage={depositStage} setStage={setDepositStage} methods={depositMethods} selected={selectedDeposit} setSelected={setDepositMethod} channels={channels} channel={channel} setChannel={setChannel} amount={amount} setAmount={setAmount} min={minDeposit} max={maxDeposit} trxId={trxId} setTrxId={setTrxId} screenshot={screenshot} onPickScreenshot={pickScreenshot} result={depositResult} busy={busy} error={error} onNext={nextDeposit} onSubmit={() => setConfirmOpen(true)} onAnother={() => { setDepositStage("amount"); setDepositResult(null); setAmount(minDeposit); setError(""); }} onRecords={() => navigate("history")} onInfo={() => setInfoOpen(true)} />}

      {view === "withdraw" && <WithdrawFlow stage={withdrawStage} methods={withdrawMethods} selected={selectedWithdraw} setSelected={setWithdrawMethod} cards={usableCards} selectedCard={selectedCard} setCard={setSelectedCardId} amount={amount} setAmount={setAmount} min={minWithdraw} max={maxWithdraw} password={transactionPassword} setPassword={setTransactionPassword} hasPassword={hasTransactionPassword} result={withdrawResult} busy={busy} error={error} onSubmit={reviewWithdraw} onBind={() => navigate("bind")} onCards={() => navigate("cards")} onAnother={() => { setWithdrawStage("form"); setWithdrawResult(null); setError(""); }} onRecords={() => navigate("history")} />}

      {view === "bind" && <BindFlow methods={withdrawMethods} selected={bindMethod} setSelected={setBindMethod} name={bindName} setName={setBindName} number={bindNumber} setNumber={setBindNumber} busy={busy} error={error} success={bindSuccess} onSubmit={addBind} onBack={() => navigate("withdraw")} onCards={() => navigate("cards")} />}

      {view === "cards" && <CardsFlow cards={cards} methodForCard={methodForCard} loading={loading} onRemove={removeCard} onBind={() => navigate("bind")} />}

      {view === "history" && <HistoryFlow view={historyView} setView={setHistory} requests={requests} transactions={transactions} bets={bets} loading={loading} />}
    </main>
    <BottomNav active={view} onChange={navigate} />

    {infoOpen && <Overlay onClose={() => setInfoOpen(false)}><div style={modalHeader}><b>পেমেন্ট নির্দেশনা</b><button type="button" onClick={() => setInfoOpen(false)} style={closeButton}><X size={18} /></button></div><div style={{ color: "#555", fontSize: 13, lineHeight: 1.75 }}><p>শুধু আপনার নির্বাচিত পেমেন্ট পদ্ধতি ব্যবহার করুন। TrxID সঠিকভাবে লিখুন এবং ভুল হলে রিকোয়েস্ট পুনরায় পাঠাবেন না।</p><p>প্রতিটি ডিপোজিট অ্যাডমিন যাচাই করার পর ব্যালেন্সে যোগ হবে। উত্তোলনের জন্য ACTIVE বা VERIFIED ওয়ালেট ব্যবহার করুন।</p></div><button type="button" onClick={() => setInfoOpen(false)} style={primaryButton}>বুঝেছি / OK</button></Overlay>}
    {confirmOpen && <Overlay onClose={() => !busy && setConfirmOpen(false)}><div style={modalHeader}><b>রিকোয়েস্ট নিশ্চিত করুন</b><button type="button" onClick={() => !busy && setConfirmOpen(false)} style={closeButton}><X size={18} /></button></div><div style={summaryBox}>{view === "withdraw" ? <><Summary label="পদ্ধতি" value={selectedWithdraw?.name || "—"} /><Summary label="ওয়ালেট" value={selectedCard?.accountNo || "—"} /><Summary label="পরিমাণ" value={`${amount} TK`} /><Summary label="স্ট্যাটাস" value="ব্যালেন্স হোল্ড করা হবে" /></> : <><Summary label="পদ্ধতি" value={`${selectedDeposit?.name || "—"} · ${channel}`} /><Summary label="পরিমাণ" value={`${amount} TK`} /><Summary label="TrxID" value={trxId || "—"} /><Summary label="স্ট্যাটাস" value="অ্যাডমিন যাচাই করবে" /></>}</div><button type="button" disabled={busy} onClick={view === "withdraw" ? submitWithdraw : submitDeposit} style={{ ...primaryButton, opacity: busy ? .55 : 1 }}>{busy ? "জমা হচ্ছে…" : "যাও / সাবমিট করুন"}</button></Overlay>}
    {previewOpen && screenshot && <Overlay onClose={() => setPreviewOpen(false)}><div style={modalHeader}><b>স্ক্রিনশট প্রিভিউ</b><button type="button" onClick={() => setPreviewOpen(false)} style={closeButton}><X size={18} /></button></div><img src={screenshot} alt="Deposit screenshot preview" style={{ width: "100%", maxHeight: 360, objectFit: "contain", borderRadius: 10, background: "#f4f4f4" }} /><button type="button" onClick={() => setPreviewOpen(false)} style={primaryButton}>ঠিক আছে</button></Overlay>}
  </div>;
}

function DepositFlow({ stage, setStage, methods, selected, setSelected, channels, channel, setChannel, amount, setAmount, min, max, trxId, setTrxId, screenshot, onPickScreenshot, result, busy, error, onNext, onSubmit, onAnother, onRecords, onInfo }: { stage: DepositStage; setStage: (stage: DepositStage) => void; methods: Method[]; selected?: Method; setSelected: (id: string) => void; channels: { id: string; label: string; bonus?: number }[]; channel: string; setChannel: (id: string) => void; amount: number; setAmount: (amount: number) => void; min: number; max: number; trxId: string; setTrxId: (value: string) => void; screenshot: string; onPickScreenshot: (file?: File | null) => void; result: RequestRow | null; busy: boolean; error: string; onNext: () => void; onSubmit: () => void; onAnother: () => void; onRecords: () => void; onInfo: () => void }) {
  if (stage === "success") return <section style={successPanel}><div style={successIcon}><Check size={32} /></div><h2 style={{ margin: "12px 0 6px" }}>ডিপোজিট রিকোয়েস্ট সফল</h2><p style={{ color: "#777", fontSize: 13 }}>আপনার রিকোয়েস্ট অ্যাডমিন যাচাই করবে।</p><div style={idBox}><span>Request ID</span><b>{result?.id || "—"}</b><button type="button" onClick={() => result?.id && navigator.clipboard?.writeText(result.id)} style={copyButton}><Copy size={15} /></button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 15 }}><button type="button" onClick={onRecords} style={secondaryButton}>রেকর্ড দেখুন</button><button type="button" onClick={onAnother} style={primaryButton}>আরেক পেমেন্ট</button></div></section>;
  return <section>
    <div style={stepBar}><Step active={stage === "amount"} done={stage !== "amount"} number="1" label="পরিমাণ" /><span style={stepLine} /><Step active={stage === "details"} done={false} number="2" label="পেমেন্ট তথ্য" /></div>
    {stage === "amount" && <><SectionTitle action={<button type="button" onClick={onInfo} style={iconButtonLight}><Info size={17} /></button>}>ডিপোজিট পদ্ধতি নির্বাচন করুন</SectionTitle><div style={tileGrid}>{methods.map((method) => <MethodTile key={method.id} method={method} selected={selected?.id === method.id} onClick={() => setSelected(method.id)} />)}</div><SectionTitle>চ্যানেল নির্বাচন করুন</SectionTitle><div style={chipRow}>{channels.map((item) => <Pill key={item.id} active={channel === item.id} onClick={() => setChannel(item.id)}>{item.label}{item.bonus ? ` +${item.bonus}` : ""}</Pill>)}</div><SectionTitle>ডিপোজিটের পরিমাণ</SectionTitle><div style={quickGrid}>{quickAmounts.filter((value) => value >= min && value <= max).map((value) => <button type="button" key={value} onClick={() => setAmount(value)} style={{ ...amountButton, borderColor: amount === value ? "#c0392b" : "#e5e5e5", color: amount === value ? "#c0392b" : "#333", background: amount === value ? "#fff5f5" : "#fff" }}>{value} TK</button>)}</div><Field label={`নিজের পরিমাণ দিন (${min} - ${max} TK)`}><input type="number" min={min} max={max} value={amount} onChange={(event) => setAmount(Number(event.target.value))} style={inputStyle} /></Field><button type="button" onClick={onNext} style={primaryButton}>পরবর্তী</button></>}
    {stage === "details" && <><div style={paymentBanner}><PaymentLogo method={selected || { id: "wallet", name: "Payment" }} size={54} /><div style={{ flex: 1 }}><b>{selected?.name || "Payment"} Deposit</b><small style={{ display: "block", marginTop: 4, opacity: .8 }}>এই নম্বরে টাকা পাঠান</small></div><button type="button" onClick={onInfo} style={{ ...iconButton, color: "#fff" }}><Info size={18} /></button></div><div style={panelStyle}><div style={{ color: "#777", fontSize: 12 }}>পেমেন্ট নম্বর</div><div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><b style={{ fontSize: 20 }}>{selected?.number || "01XXXXXXXXX"}</b><button type="button" onClick={() => selected?.number && navigator.clipboard?.writeText(selected.number)} style={copyButton}><Copy size={15} /></button></div><p style={{ color: "#777", fontSize: 12, lineHeight: 1.6 }}>{selected?.instructionsBn || "টাকা পাঠানোর পর TrxID লিখুন।"}</p></div><Field label="TrxID"><input value={trxId} onChange={(event) => setTrxId(event.target.value)} placeholder="লেনদেনের TrxID লিখুন" style={inputStyle} /></Field><Field label="স্ক্রিনশট (ঐচ্ছিক)"><label style={uploadBox}><Upload size={18} />{screenshot ? "স্ক্রিনশট যুক্ত হয়েছে" : "স্ক্রিনশট নির্বাচন করুন"}<input type="file" accept="image/*" onChange={(event) => onPickScreenshot(event.target.files?.[0])} style={{ display: "none" }} /></label></Field><div style={{ display: "flex", gap: 9 }}><button type="button" onClick={() => setStage("amount")} style={secondaryButton}>পিছনে</button><button type="button" onClick={onNext} style={{ ...primaryButton, flex: 1 }}>পরবর্তী</button></div></>}
    {error && <div style={errorBox}>{error}</div>}
  </section>;
}

function WithdrawFlow({ stage, methods, selected, setSelected, cards, selectedCard, setCard, amount, setAmount, min, max, password, setPassword, hasPassword, result, busy, error, onSubmit, onBind, onCards, onAnother, onRecords }: { stage: WithdrawStage; methods: Method[]; selected?: Method; setSelected: (id: string) => void; cards: WalletCard[]; selectedCard?: WalletCard; setCard: (id: string) => void; amount: number; setAmount: (amount: number) => void; min: number; max: number; password: string; setPassword: (value: string) => void; hasPassword: boolean | null; result: RequestRow | null; busy: boolean; error: string; onSubmit: () => void; onBind: () => void; onCards: () => void; onAnother: () => void; onRecords: () => void }) {
  if (stage === "success") return <section style={successPanel}><div style={{ ...successIcon, background: "#e8f5ff", color: "#2379b8" }}><Check size={32} /></div><h2 style={{ margin: "12px 0 6px" }}>উত্তোলন রিকোয়েস্ট জমা হয়েছে</h2><p style={{ color: "#777", fontSize: 13 }}>অ্যাডমিন প্রসেস করার পর স্ট্যাটাস আপডেট হবে।</p><div style={idBox}><span>Request ID</span><b>{result?.id || "—"}</b></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 15 }}><button type="button" onClick={onRecords} style={secondaryButton}>রেকর্ড দেখুন</button><button type="button" onClick={onAnother} style={primaryButton}>আরেকটি উতোলন</button></div></section>;
  return <section><SectionTitle>উত্তোলনের পেমেন্ট পদ্ধতি</SectionTitle><div style={tileGrid}>{methods.map((method) => <MethodTile key={method.id} method={method} selected={selected?.id === method.id} onClick={() => setSelected(method.id)} />)}</div><SectionTitle action={<button type="button" onClick={onCards} style={linkButton}>কার্ড ম্যানেজ করুন ›</button>}>উত্তোলনের ওয়ালেট</SectionTitle>{cards.length ? cards.map((card) => <button type="button" key={card.id} onClick={() => { setCard(card.id); setSelected(card.method); }} style={{ ...cardSelect, borderColor: selectedCard?.id === card.id ? "#e8000d" : "#e5e5e5", background: selectedCard?.id === card.id ? "#fff8f8" : "#fff" }}><PaymentLogo method={methods.find((method) => method.id === card.method) || { id: card.method, name: card.label }} size={39} /><span style={{ flex: 1, textAlign: "left" }}><b>{card.label}</b><small style={{ display: "block", color: "#888", marginTop: 3 }}>{card.accountNo}</small></span><span>{selectedCard?.id === card.id ? "✓" : "○"}</span></button>) : <div style={emptyStyle}><p style={{ marginTop: 0 }}>কোনো সক্রিয় ওয়ালেট নেই</p><button type="button" onClick={onBind} style={secondaryButton}>ই-ওয়ালেট বাঁধুন</button></div>}<Field label={`উত্তোলনের পরিমাণ (${min} - ${max} TK)`}><input type="number" min={min} max={max} value={amount} onChange={(event) => setAmount(Number(event.target.value))} style={inputStyle} /></Field>{hasPassword === false && <div style={warningBox}><ShieldCheck size={17} />লেনদেন পাসওয়ার্ড সেট করা নেই। সিকিউরিটি সেটিংস থেকে আগে সেট করুন।</div>}<Field label="লেনদেন পাসওয়ার্ড"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="লেনদেন পাসওয়ার্ড লিখুন" style={inputStyle} /></Field>{error && <div style={errorBox}>{error}</div>}<button type="button" disabled={busy || !selectedCard} onClick={onSubmit} style={{ ...primaryButton, background: "#e8000d", opacity: busy || !selectedCard ? .55 : 1 }}>{busy ? "জমা হচ্ছে…" : "উতোলন জমা দিন"}</button></section>;
}

function BindFlow({ methods, selected, setSelected, name, setName, number, setNumber, busy, error, success, onSubmit, onBack, onCards }: { methods: Method[]; selected: string; setSelected: (id: string) => void; name: string; setName: (value: string) => void; number: string; setNumber: (value: string) => void; busy: boolean; error: string; success: boolean; onSubmit: (event: React.FormEvent) => void; onBack: () => void; onCards: () => void }) {
  return <section><div style={bindHero}><div style={{ ...heroIcon, background: "rgba(255,255,255,.18)" }}><WalletCards size={27} /></div><div><h2 style={{ margin: 0, fontSize: 18 }}>উত্তোলনের ওয়ালেট যোগ করুন</h2><p style={{ margin: "6px 0 0", opacity: .8, fontSize: 12 }}>আপনার নিজের অ্যাকাউন্ট ব্যবহার করুন।</p></div></div><form onSubmit={onSubmit} style={panelStyle}><SectionTitle>ওয়ালেটের ধরন</SectionTitle><div style={tileGrid}>{methods.map((method) => <MethodTile key={method.id} method={method} selected={selected === method.id} onClick={() => setSelected(method.id)} />)}</div><Field label="প্রাপকের পূর্ণ নাম"><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="পূর্ণ নাম লিখুন" style={inputStyle} /></Field><Field label="ওয়ালেট অ্যাকাউন্ট নম্বর"><input value={number} onChange={(event) => setNumber(event.target.value)} required inputMode="tel" placeholder="অ্যাকাউন্ট নম্বর লিখুন" style={inputStyle} /></Field><div style={warningBox}><ShieldCheck size={17} />ওয়ালেট যোগ করার পর অ্যাডমিন যাচাই করতে পারেন। যাচাই না হওয়া পর্যন্ত এটি উত্তোলনে ব্যবহার করা যাবে না।</div>{error && <div style={errorBox}>{error}</div>}{success && <div style={successBox}><CheckCircle2 size={17} />ওয়ালেট সফলভাবে যোগ হয়েছে।</div>}<button type="submit" disabled={busy || !selected} style={{ ...primaryButton, opacity: busy ? .55 : 1 }}>{busy ? "যোগ হচ্ছে…" : "ওয়ালেট যোগ করুন"}</button></form><div style={{ display: "flex", gap: 9 }}><button type="button" onClick={onBack} style={secondaryButton}>উত্তোলনে ফিরুন</button><button type="button" onClick={onCards} style={{ ...secondaryButton, flex: 1 }}>আমার কার্ড দেখুন</button></div></section>;
}

function CardsFlow({ cards, methodForCard, loading, onRemove, onBind }: { cards: WalletCard[]; methodForCard: (card: WalletCard) => Method | { id: string; name: string }; loading: boolean; onRemove: (id: string) => void; onBind: () => void }) { return <section><SectionTitle action={<button type="button" onClick={onBind} style={linkButton}>＋ যোগ করুন</button>}>সংরক্ষিত ওয়ালেট · {cards.length}</SectionTitle>{loading ? <Empty>লোড হচ্ছে…</Empty> : cards.length ? cards.map((card) => <div key={card.id} style={cardRow}><PaymentLogo method={methodForCard(card)} size={48} /><div style={{ flex: 1, minWidth: 0 }}><b>{card.label}</b><div style={{ color: "#777", marginTop: 4 }}>{card.accountNo}</div><small style={{ color: card.status === "ACTIVE" || card.status === "VERIFIED" ? "#198754" : "#bd7d00" }}>{card.status || "PENDING"}</small>{card.rejectionReason && <small style={{ display: "block", color: "#d33", marginTop: 3 }}>{card.rejectionReason}</small>}</div><button type="button" onClick={() => onRemove(card.id)} style={deleteButton} aria-label="Remove wallet"><Trash2 size={17} /></button></div>) : <Empty>কোনো ওয়ালেট যোগ করা নেই<button type="button" onClick={onBind} style={{ ...primaryButton, marginTop: 14 }}>＋ নতুন যোগ করুন</button></Empty>}</section>; }

function HistoryFlow({ view, setView, requests, transactions, bets, loading }: { view: HistoryView; setView: (view: HistoryView) => void; requests: RequestRow[]; transactions: TxRow[]; bets: BetRow[]; loading: boolean }) { return <section><div style={tabRow}>{([["requests", "রিকোয়েস্ট"], ["money", "মানি"], ["bets", "বেটিং"]] as Array<[HistoryView, string]>).map(([id, label]) => <button type="button" key={id} onClick={() => setView(id)} style={{ ...tabButton, background: view === id ? "#c0392b" : "#fff", color: view === id ? "#fff" : "#555" }}>{label}</button>)}</div>{loading ? <Empty>রেকর্ড লোড হচ্ছে…</Empty> : view === "requests" ? requests.length ? requests.map((row) => <RecordRow key={row.id} row={row} />) : <Empty>কোনো রিকোয়েস্ট নেই</Empty> : view === "money" ? transactions.length ? transactions.map((row) => <div key={row.id} style={recordRow}><div><b>{row.method || row.type}</b><small style={{ display: "block", color: "#888", marginTop: 4 }}>{row.note || row.createdAt}</small></div><strong style={{ color: row.amount >= 0 ? "#198754" : "#d33" }}>{row.amount >= 0 ? "+" : ""}{row.amount.toFixed(2)} TK</strong></div>) : <Empty>কোনো মানি রেকর্ড নেই</Empty> : bets.length ? bets.map((row) => <div key={row.id} style={recordRow}><div><b>{row.gameType}</b><small style={{ display: "block", color: "#888", marginTop: 4 }}>{row.createdAt}</small></div><div style={{ textAlign: "right" }}><strong>{row.amount.toFixed(2)} TK</strong><small style={{ display: "block", color: row.won ? "#198754" : "#d33" }}>{row.won ? `+${row.payout.toFixed(2)}` : "হার"}</small></div></div>) : <Empty>কোনো বেটিং রেকর্ড নেই</Empty>}</section>; }
function RecordRow({ row }: { row: RequestRow }) { return <div style={recordRow}><div style={{ minWidth: 0 }}><b>{row.method} · {row.type}</b><small style={{ display: "block", color: "#888", marginTop: 4 }}>{row.channel || "Standard"} · {new Date(row.createdAt).toLocaleString()}</small>{row.trxId && <small style={{ display: "block", color: "#888", marginTop: 3 }}>TrxID: {row.trxId}</small>}</div><div style={{ textAlign: "right", flexShrink: 0 }}><strong>{row.amount.toFixed(2)} TK</strong><small style={{ display: "block", color: row.status === "APPROVED" ? "#198754" : row.status === "REJECTED" ? "#d33" : "#bd7d00", marginTop: 4 }}>{row.status}</small></div></div>; }
function Step({ active, done, number, label }: { active: boolean; done: boolean; number: string; label: string }) { return <div style={{ display: "flex", alignItems: "center", gap: 6, color: active || done ? "#c0392b" : "#999", fontSize: 12, fontWeight: 800 }}><span style={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", background: active || done ? "#c0392b" : "#eee", color: active || done ? "#fff" : "#888" }}>{done ? "✓" : number}</span>{label}</div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #eee", padding: "9px 0", fontSize: 13 }}><span style={{ color: "#777" }}>{label}</span><b style={{ textAlign: "right" }}>{value}</b></div>; }

export function FullWalletPage({ forcedView }: { forcedView?: View } = {}) { return <Suspense fallback={<div style={pageStyle}><Empty>লোড হচ্ছে…</Empty></div>}><WalletFlowInner forcedView={forcedView} /></Suspense>; }
export function FullBindPage() { return <FullWalletPage forcedView="bind" />; }

const pageStyle: CSSProperties = { minHeight: "calc(100dvh - 5rem)", maxWidth: 520, margin: "0 auto", background: "#f7f7f7", color: "#1c1c1c", fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif" };
const headerStyle: CSSProperties = { position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 7, background: "#1a1f2e", color: "#fff", padding: "13px 12px", boxShadow: "0 3px 15px rgba(0,0,0,.14)" };
const iconButton: CSSProperties = { border: "none", background: "transparent", color: "inherit", padding: 7, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" };
const iconButtonLight: CSSProperties = { ...iconButton, color: "#c0392b", background: "#fff" };
const balanceCard: CSSProperties = { marginTop: 14, borderRadius: 16, padding: 18, color: "#fff", background: "linear-gradient(135deg,#1a263c,#2a7d65 55%,#23b978)", boxShadow: "0 10px 24px rgba(25,116,90,.18)" };
const roundAction: CSSProperties = { border: "none", borderRadius: 25, padding: "9px 18px", fontSize: 13, fontWeight: 900, cursor: "pointer" };
const noticeStyle: CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 8, marginTop: 10, border: "1px solid #f0dfab", borderRadius: 11, padding: "10px 12px", background: "#fff9e8", color: "#795b15", fontSize: 11, textAlign: "left", cursor: "pointer" };
const panelStyle: CSSProperties = { background: "#fff", border: "1px solid #ececec", borderRadius: 14, padding: 14, boxShadow: "0 4px 15px rgba(0,0,0,.035)" };
const quickTile: CSSProperties = { minHeight: 98, border: "1px solid #eee", borderRadius: 14, background: "#fff", padding: 13, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, cursor: "pointer", textAlign: "left" };
const linkButton: CSSProperties = { border: "none", background: "transparent", color: "#c0392b", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const tileGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 };
const methodTileStyle: CSSProperties = { minHeight: 92, border: "2px solid", borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" };
const chipRow: CSSProperties = { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 3 };
const pillStyle: CSSProperties = { border: "none", borderRadius: 20, padding: "8px 13px", whiteSpace: "nowrap", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const quickGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 };
const amountButton: CSSProperties = { border: "2px solid", borderRadius: 9, padding: "10px 4px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const fieldLabel: CSSProperties = { display: "block", margin: "14px 0", fontSize: 13, fontWeight: 800 };
const inputStyle: CSSProperties = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 7, border: "1px solid #e4e4e4", borderRadius: 10, background: "#fafafa", padding: "12px 13px", fontSize: 15, outline: "none" };
const primaryButton: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", border: "none", borderRadius: 11, background: "#c0392b", color: "#fff", padding: "13px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer" };
const secondaryButton: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #d9d9d9", borderRadius: 11, background: "#fff", color: "#444", padding: "12px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const paymentBanner: CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginBottom: 13, borderRadius: 14, padding: 15, color: "#fff", background: "linear-gradient(135deg,#7c2d91,#cf3e52)" };
const uploadBox: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 68, marginTop: 7, border: "1px dashed #c0392b", borderRadius: 10, background: "#fff8f8", color: "#c0392b", cursor: "pointer", fontSize: 13, fontWeight: 800 };
const errorBox: CSSProperties = { margin: "12px 0", borderRadius: 9, padding: "10px 12px", background: "#fff0f0", color: "#bd2d2d", fontSize: 12, fontWeight: 700 };
const warningBox: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 8, margin: "12px 0", borderRadius: 10, padding: "11px 12px", background: "#fff9e8", color: "#795b15", fontSize: 12, lineHeight: 1.5 };
const successBox: CSSProperties = { display: "flex", alignItems: "center", gap: 8, margin: "12px 0", borderRadius: 10, padding: "11px 12px", background: "#eaf8ef", color: "#198754", fontSize: 12, fontWeight: 800 };
const successPanel: CSSProperties = { marginTop: 25, borderRadius: 17, padding: 22, background: "#fff", border: "1px solid #ececec", textAlign: "center", boxShadow: "0 8px 26px rgba(0,0,0,.06)" };
const successIcon: CSSProperties = { width: 62, height: 62, margin: "0 auto", display: "grid", placeItems: "center", borderRadius: "50%", background: "#eaf8ef", color: "#198754" };
const idBox: CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginTop: 18, borderRadius: 10, padding: "11px 12px", background: "#f7f7f7", textAlign: "left", fontSize: 12 };
const idBoxText: CSSProperties = { display: "flex", flexDirection: "column", flex: 1 };
const copyButton: CSSProperties = { border: "none", borderRadius: 8, background: "#fff", color: "#c0392b", padding: 7, cursor: "pointer", display: "grid", placeItems: "center" };
const stepBar: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "16px 0 18px" };
const stepLine: CSSProperties = { width: 45, height: 2, background: "#e7c0bb" };
const cardSelect: CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 9, border: "1px solid", borderRadius: 11, padding: 11, cursor: "pointer" };
const cardRow: CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginBottom: 10, border: "1px solid #ececec", borderRadius: 13, padding: 12, background: "#fff" };
const deleteButton: CSSProperties = { border: "none", borderRadius: 9, background: "#fff0f0", color: "#d33", padding: 9, cursor: "pointer" };
const emptyStyle: CSSProperties = { border: "1px dashed #ddd", borderRadius: 13, padding: "32px 16px", textAlign: "center", color: "#888", fontSize: 13 };
const recordRow: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 9, border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff", fontSize: 13 };
const tabRow: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, margin: "16px 0 12px" };
const tabButton: CSSProperties = { border: "1px solid #e5e5e5", borderRadius: 10, padding: "10px 4px", fontSize: 12, fontWeight: 900, cursor: "pointer" };
const bindHero: CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginTop: 16, borderRadius: 15, padding: 17, color: "#fff", background: "linear-gradient(135deg,#1a1f2e,#c0392b)" };
const heroIcon: CSSProperties = { width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 14 };
const modalHeader: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15, fontSize: 17 };
const closeButton: CSSProperties = { border: "none", background: "#f4f4f4", borderRadius: "50%", padding: 7, cursor: "pointer", display: "grid", placeItems: "center" };
const summaryBox: CSSProperties = { borderRadius: 11, background: "#fafafa", padding: "3px 12px", marginBottom: 16 };
const overlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, background: "rgba(0,0,0,.5)" };
const modalStyle: CSSProperties = { width: "100%", maxWidth: 380, maxHeight: "90dvh", overflowY: "auto", borderRadius: 16, padding: 18, background: "#fff", boxShadow: "0 15px 55px rgba(0,0,0,.24)" };
const bottomNavStyle: CSSProperties = { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, paddingBottom: "env(safe-area-inset-bottom)", background: "#fff", borderTop: "1px solid #eee", boxShadow: "0 -5px 20px rgba(0,0,0,.08)" };
const bottomButton: CSSProperties = { display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "transparent", padding: "7px 2px", fontSize: 10, cursor: "pointer" };
