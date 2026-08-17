"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

type PaymentMethod = {
  id: string;
  name: string;
  enabled?: boolean;
  number?: string;
  logo?: string;
  instructionsBn?: string;
  warningBn?: string;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  channels?: { id: string; label: string; bonus?: number }[];
};

type Card = {
  id: string;
  method: string;
  label: string;
  accountNo: string;
  accountName?: string | null;
  status?: string;
  createdAt: string;
};

type RequestRow = {
  id: string;
  type: string;
  method: string;
  channel?: string | null;
  amount: number;
  status: string;
  trxId?: string | null;
  feeAmount?: number;
  netAmount?: number | null;
  rejectionReason?: string | null;
  createdAt: string;
};

type MoneyRow = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string | null;
  method?: string | null;
  reference?: string | null;
  status?: string | null;
  createdAt: string;
};

type BetRow = {
  id: string;
  gameType: string;
  amount: number;
  payout: number;
  won: boolean;
  createdAt: string;
};

const fallbackMethods: PaymentMethod[] = [
  { id: "nagad", name: "Nagad", number: "", depositEnabled: true, withdrawEnabled: true, channels: [{ id: "standard", label: "Standard channel" }] },
  { id: "rocket", name: "Rocket", number: "", depositEnabled: true, withdrawEnabled: true, channels: [{ id: "standard", label: "Standard channel" }] },
];

const logos: Record<string, string> = {
  bkash: "https://cdn.jsdelivr.net/gh/thomasneverdi3-creator/resource@main/bkash.png",
  nagad: "https://tycoon.worldxpp.com/banks/Nagad.png",
  rocket: "https://images.3820949.com/mcs-images/bank_type/ROCKET/BN_2_20240312230029166.png",
};

function logoFor(method: PaymentMethod) {
  return method.logo || logos[method.id.toLowerCase()] || "https://images.3820949.com/mcs-images/withdraw_group_icon/EWALLET_BANK_DEFAULT_ICON.png";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function makeIdempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function TopBar({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  return (
    <header style={{ background: "#1a1f2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", position: "sticky", top: 0, zIndex: 10 }}>
      <button type="button" onClick={onBack} style={{ width: 56, background: "none", border: "none", color: "#fff", fontSize: 28, cursor: onBack ? "pointer" : "default", textAlign: "left" }}>{onBack ? "‹" : ""}</button>
      <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
      <div style={{ width: 56, display: "flex", justifyContent: "flex-end" }}>{action}</div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: "calc(100dvh - 5rem)", maxWidth: 430, margin: "0 auto", background: "#f5f6fa", color: "#222", fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif" }}>{children}</div>;
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}><div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 10px 40px rgba(0,0,0,.22)" }}>{children}</div></div>;
}

export function ReferenceDepositPage() {
  const router = useRouter();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>(fallbackMethods);
  const [methodId, setMethodId] = useState("nagad");
  const [channel, setChannel] = useState("standard");
  const [amount, setAmount] = useState(500);
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [min, setMin] = useState(100);
  const [max, setMax] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wallet/request", { credentials: "include" }).then((r) => r.json()).then((j) => {
      if (!j.ok) return;
      const cfg = j.data?.paymentConfig;
      const available = Array.isArray(cfg?.methods) ? cfg.methods.filter((m: PaymentMethod) => m.enabled !== false && m.depositEnabled !== false) : [];
      if (available.length) { setMethods(available); setMethodId(available[0].id); setChannel(available[0].channels?.[0]?.id || "standard"); }
      if (cfg?.minDeposit) setMin(Number(cfg.minDeposit));
      if (cfg?.maxDeposit) setMax(Number(cfg.maxDeposit));
    }).catch(() => {});
  }, []);

  const selected = methods.find((item) => item.id === methodId) || methods[0];
  const channels = selected?.channels?.length ? selected.channels : [{ id: "standard", label: "Standard channel" }];

  useEffect(() => { if (channels[0] && !channels.some((item) => item.id === channel)) setChannel(channels[0].id); }, [channel, channels]);

  async function submit() {
    if (!selected || !trxId.trim() || amount < min || amount > max) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/request", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "DEPOSIT", method: selected.id, channel, amount, trxId: trxId.trim(), screenshot: screenshot || undefined, idempotencyKey: makeIdempotencyKey("deposit") }) });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error || "ডিপোজিট জমা দেওয়া যায়নি"); return; }
      setSubmitted(json.data?.request?.id || "submitted");
      toast.success("ডিপোজিট রিকোয়েস্ট জমা হয়েছে");
    } catch { toast.error("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return <Shell>
    <TopBar title="জমা দিন" onBack={() => router.back()} />
    <div style={{ padding: 16 }}>
      {submitted ? <div style={{ background: "#fff", borderRadius: 12, padding: 24, textAlign: "center", border: "1px solid #eee" }}><div style={{ margin: "0 auto 12px", width: 52, height: 52, borderRadius: "50%", background: "#eaf8ef", color: "#1c9c56", display: "grid", placeItems: "center", fontSize: 30 }}>✓</div><h2 style={{ margin: 0, fontSize: 18 }}>সফলভাবে জমা হয়েছে</h2><p style={{ color: "#777", fontSize: 13 }}>রিকোয়েস্ট আইডি: {submitted}</p><button type="button" onClick={() => router.push("/wallet/records?type=DEPOSIT")} style={primaryButton}>জমা রেকর্ড দেখুন</button></div> : <>
        <p style={labelStyle}>পেমেন্ট পদ্ধতি নির্বাচন করুন</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>{methods.map((item) => <button type="button" key={item.id} onClick={() => { setMethodId(item.id); setChannel(item.channels?.[0]?.id || "standard"); }} style={{ ...methodCard, borderColor: item.id === selected?.id ? "#c0392b" : "#ddd", color: item.id === selected?.id ? "#c0392b" : "#333", background: item.id === selected?.id ? "#fff8f8" : "#fff" }}><img src={logoFor(item)} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} /><span>{item.name}</span></button>)}</div>
        <section style={panelStyle}>
          <p style={labelStyle}>চ্যানেল নির্বাচন করুন</p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>{channels.map((item) => <button type="button" key={item.id} onClick={() => setChannel(item.id)} style={{ ...pillButton, background: channel === item.id ? "#c0392b" : "#f5f5f5", color: channel === item.id ? "#fff" : "#555" }}>{item.label}{item.bonus ? ` +${item.bonus}` : ""}</button>)}</div>
          {selected?.number ? <div style={{ marginTop: 10, background: "#fff8ec", borderRadius: 8, padding: 12, fontSize: 14 }}>পেমেন্ট নম্বর: <b>{selected.number}</b></div> : null}
          {selected?.instructionsBn ? <p style={{ margin: "12px 0 0", color: "#666", fontSize: 12, lineHeight: 1.6 }}>{selected.instructionsBn}</p> : null}
        </section>
        <label style={fieldLabel}>পরিমাণ
          <input type="number" min={min} max={max} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={inputStyle} />
        </label>
        <label style={fieldLabel}>TrxID
          <input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="* লেনদেনের TrxID লিখুন" style={inputStyle} />
        </label>
        <label style={fieldLabel}>স্ক্রিনশট <span style={{ color: "#999", fontWeight: 400 }}>(ঐচ্ছিক)</span>
          <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setScreenshot(String(reader.result)); reader.readAsDataURL(file); }} style={{ ...inputStyle, padding: 9 }} />
        </label>
        <p style={{ color: "#c0392b", fontSize: 12 }}>সর্বনিম্ন {min} TK · সর্বোচ্চ {max} TK</p>
        <button type="button" onClick={submit} disabled={loading || !trxId.trim() || amount < min || amount > max} style={{ ...primaryButton, opacity: loading || !trxId.trim() ? .55 : 1 }}>{loading ? "জমা হচ্ছে…" : "নিশ্চিত করুন"}</button>
      </>}
    </div>
    <BottomNav active="deposit" onNavigate={(key) => { if (key === "withdraw") router.push("/wallet/withdraw"); if (key === "records") router.push("/wallet/records"); if (key === "profile") router.push("/profile"); }} />
  </Shell>;
}

export function ReferenceWithdrawPage() {
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const setBalance = useAuthStore((state) => state.setBalance);
  const [methods, setMethods] = useState<PaymentMethod[]>(fallbackMethods);
  const [cards, setCards] = useState<Card[]>([]);
  const [methodId, setMethodId] = useState("nagad");
  const [cardId, setCardId] = useState("");
  const [amount, setAmount] = useState(200);
  const [password, setPassword] = useState("");
  const [min, setMin] = useState(200);
  const [max, setMax] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [configRes, cardsRes] = await Promise.all([fetch("/api/wallet/request", { credentials: "include" }), fetch("/api/wallet/cards", { credentials: "include" })]);
    const config = await configRes.json(); const cardsJson = await cardsRes.json();
    if (config.ok) { const cfg = config.data?.paymentConfig; const available = Array.isArray(cfg?.methods) ? cfg.methods.filter((m: PaymentMethod) => m.enabled !== false && m.withdrawEnabled !== false) : []; if (available.length) { setMethods(available); setMethodId(available[0].id); } if (cfg?.minWithdraw) setMin(Number(cfg.minWithdraw)); if (cfg?.maxWithdraw) setMax(Number(cfg.maxWithdraw)); }
    if (cardsJson.ok) { const next = (cardsJson.data?.cards || []) as Card[]; setCards(next); const usable = next.find((card) => card.status === "ACTIVE" || card.status === "VERIFIED"); if (usable) { setCardId(usable.id); setMethodId(usable.method); } }
  }
  useEffect(() => { load().catch(() => {}); }, []);

  const selected = methods.find((item) => item.id === methodId) || methods[0];
  const usableCards = cards.filter((card) => card.status === "ACTIVE" || card.status === "VERIFIED");
  const selectedCard = usableCards.find((card) => card.id === cardId);

  async function submit() {
    setError("");
    if (!user || !password || amount < min || amount > max || !selected || !selectedCard) { setError("ওয়ালেট, পরিমাণ এবং লেনদেন পাসওয়ার্ড পূরণ করুন"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/request", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "WITHDRAW", method: selected.id, amount, cardId: selectedCard.id, transactionPassword: password, idempotencyKey: makeIdempotencyKey("withdraw") }) });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "উত্তোলন জমা দেওয়া যায়নি"); return; }
      if (typeof json.data?.balance === "number") setBalance(json.data.balance);
      toast.success("উত্তোলন রিকোয়েস্ট জমা হয়েছে");
      router.push("/wallet/records?type=WITHDRAW");
    } catch { setError("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return <Shell>
    <TopBar title="উতোলন" onBack={() => router.back()} action={<button type="button" onClick={() => router.push("/wallet/cards")} style={topLink}>কার্ড</button>} />
    <div style={{ padding: 16 }}>
      <div style={{ background: "#1a1f2e", color: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 }}><div style={{ fontSize: 12, color: "#b9c2d5" }}>বর্তমান ব্যালেন্স</div><div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>৳ {Number(user?.balance || 0).toFixed(2)}</div></div>
      <p style={labelStyle}>ই-ওয়ালেট গ্রুপ নির্বাচন করুন</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 18 }}>{methods.map((item) => <button type="button" key={item.id} onClick={() => { setMethodId(item.id); const next = usableCards.find((card) => card.method === item.id); if (next) setCardId(next.id); }} style={{ ...methodCard, minWidth: 92, borderColor: item.id === selected?.id ? "#e8000d" : "#ddd", color: item.id === selected?.id ? "#e8000d" : "#333" }}><img src={logoFor(item)} alt="" style={{ width: 42, height: 42, objectFit: "contain" }} /><span>{item.name}</span></button>)}</div>
      <section style={panelStyle}>
        <p style={labelStyle}>উত্তোলনের ওয়ালেট নির্বাচন করুন</p>
        {usableCards.length ? usableCards.map((card) => <button type="button" key={card.id} onClick={() => { setCardId(card.id); setMethodId(card.method); }} style={{ ...cardRow, borderColor: card.id === cardId ? "#e8000d" : "#eee", background: card.id === cardId ? "#fff8f8" : "#fff" }}><img src={logoFor({ id: card.method, name: card.label })} alt="" style={{ width: 38, height: 38, objectFit: "contain" }} /><span style={{ flex: 1, textAlign: "left" }}><b>{card.label}</b><small style={{ display: "block", color: "#888", marginTop: 3 }}>{card.accountNo}</small></span><span style={{ color: card.id === cardId ? "#e8000d" : "#aaa", fontSize: 20 }}>{card.id === cardId ? "✓" : "○"}</span></button>) : <div style={{ border: "1px dashed #ccc", borderRadius: 10, padding: 18, textAlign: "center", color: "#888", fontSize: 13 }}>কোনো ব্যবহারযোগ্য ওয়ালেট নেই<button type="button" onClick={() => router.push("/wallet/bind")} style={{ ...secondaryButton, display: "block", margin: "12px auto 0" }}>ই-ওয়ালেট বাঁধুন</button></div>}
      </section>
      <label style={fieldLabel}>উত্তোলনের পরিমাণ
        <input type="number" min={min} max={max} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={inputStyle} />
      </label>
      <label style={fieldLabel}>লেনদেন পাসওয়ার্ড
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="* লেনদেন পাসওয়ার্ড লিখুন" style={inputStyle} />
      </label>
      <p style={{ color: "#e8000d", fontSize: 12 }}>সর্বনিম্ন {min} TK · সর্বোচ্চ {max} TK</p>
      {error ? <div style={{ borderRadius: 8, background: "#fff0f0", color: "#c0392b", padding: 11, fontSize: 13, marginBottom: 12 }}>{error}</div> : null}
      <button type="button" onClick={submit} disabled={loading || !selectedCard} style={{ ...primaryButton, background: "#e8000d", opacity: loading || !selectedCard ? .55 : 1 }}>{loading ? "জমা হচ্ছে…" : "উতোলন জমা দিন"}</button>
    </div>
    <BottomNav active="withdraw" onNavigate={(key) => { if (key === "deposit") router.push("/wallet/deposit"); if (key === "records") router.push("/wallet/records"); if (key === "profile") router.push("/profile"); }} />
  </Shell>;
}

export function ReferenceCardsPage() {
  const router = useRouter();
  const toast = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/wallet/cards", { credentials: "include" }).then((r) => r.json()).then((j) => { if (j.ok) setCards(j.data?.cards || []); }).finally(() => setLoading(false)); }, []);
  async function remove(id: string) { const res = await fetch(`/api/wallet/cards?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" }); const json = await res.json(); if (json.ok) { setCards((value) => value.filter((card) => card.id !== id)); toast.success("কার্ড সরানো হয়েছে"); } else toast.error(json.error || "কার্ড সরানো যায়নি"); }
  return <Shell><TopBar title="আমার কার্ড" onBack={() => router.back()} action={<button type="button" onClick={() => router.push("/wallet/bind")} style={topLink}>＋</button>} /><div style={{ padding: 16 }}><p style={{ color: "#e8a700", fontSize: 13 }}>● ই-ওয়ালেট যোগ করা হয়েছে: {cards.length}</p>{loading ? <div style={emptyStyle}>লোড হচ্ছে…</div> : cards.length ? cards.map((card) => <div key={card.id} style={cardDisplay}><img src={logoFor({ id: card.method, name: card.label })} alt="" style={{ width: 52, height: 52, objectFit: "contain" }} /><div style={{ flex: 1 }}><b>{card.label}</b><div style={{ color: "#888", marginTop: 4 }}>{card.accountNo}</div><small style={{ color: "#aaa" }}>{formatDate(card.createdAt)} · {card.status}</small></div><button type="button" onClick={() => remove(card.id)} style={deleteButton}>×</button></div>) : <div style={emptyStyle}>কোনো ই-ওয়ালেট যোগ করা নেই</div>}<button type="button" onClick={() => router.push("/wallet/bind")} style={{ ...primaryButton, marginTop: 18 }}>＋ নতুন যোগ করুন</button></div></Shell>;
}

export function ReferenceRecordsPage() {
  const router = useRouter();
  const [view, setView] = useState<"bets" | "money" | "requests">("requests");
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAW" | "">("");
  const [rows, setRows] = useState<Array<RequestRow | MoneyRow | BetRow>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); const params = new URLSearchParams({ view }); if (type) params.set("type", type); fetch(`/api/wallet/records?${params}`, { credentials: "include" }).then((r) => r.json()).then((j) => { if (!j.ok) return; const data = j.data || {}; setRows(view === "bets" ? data.bets || [] : view === "money" ? data.transactions || [] : data.requests || []); }).finally(() => setLoading(false)); }, [view, type]);
  const title = view === "bets" ? "বেটিং রেকর্ড" : view === "money" ? "মানি রেকর্ড" : type === "DEPOSIT" ? "জমা রেকর্ড" : type === "WITHDRAW" ? "উতোলন রেকর্ড" : "জমা ও উত্তোলন রেকর্ড";
  return <Shell><TopBar title={title} onBack={() => router.back()} /><div style={{ background: "#fff", borderBottom: "1px solid #eee", display: "flex" }}>{[["bets", "বেটিং"], ["money", "মানি"], ["requests", "রিকোয়েস্ট"]].map(([id, label]) => <button type="button" key={id} onClick={() => setView(id as typeof view)} style={{ ...tabButton, color: view === id ? "#2196f3" : "#555", borderBottomColor: view === id ? "#2196f3" : "transparent" }}>{label}</button>)}</div>{view === "requests" && <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}><button type="button" onClick={() => setType("")} style={{ ...pillButton, background: !type ? "#2196f3" : "#eee", color: !type ? "#fff" : "#555" }}>সব</button><button type="button" onClick={() => setType("DEPOSIT")} style={{ ...pillButton, background: type === "DEPOSIT" ? "#2196f3" : "#eee", color: type === "DEPOSIT" ? "#fff" : "#555" }}>জমা</button><button type="button" onClick={() => setType("WITHDRAW")} style={{ ...pillButton, background: type === "WITHDRAW" ? "#2196f3" : "#eee", color: type === "WITHDRAW" ? "#fff" : "#555" }}>উতোলন</button></div>}<div style={{ padding: 16 }}>{loading ? <div style={emptyStyle}>রেকর্ড লোড হচ্ছে…</div> : rows.length ? rows.map((row) => <div key={row.id} style={recordRow}><div><b>{"method" in row ? `${row.method} · ${row.type}` : "gameType" in row ? row.gameType : row.method || row.type}</b><small style={{ display: "block", color: "#888", marginTop: 4 }}>{formatDate(row.createdAt)}{"trxId" in row && row.trxId ? ` · TrxID: ${row.trxId}` : ""}</small></div><div style={{ textAlign: "right" }}><b>{("payout" in row ? row.payout : row.amount).toFixed(2)} TK</b><small style={{ display: "block", color: "payout" in row ? row.won ? "#179447" : "#e53935" : row.status === "APPROVED" ? "#179447" : row.status === "REJECTED" ? "#e53935" : "#d08a00", marginTop: 4 }}>{"payout" in row ? row.won ? "জয়" : "হার" : row.status || "—"}</small></div></div>) : <div style={emptyStyle}>কোনো ডেটা নেই</div>}</div></Shell>;
}

function BottomNav({ active, onNavigate }: { active: string; onNavigate: (key: string) => void }) {
  return <nav style={{ position: "sticky", bottom: 0, display: "flex", background: "#1a1f2e", color: "#fff", padding: "7px 4px", zIndex: 9 }}>{[["deposit", "জমা"], ["withdraw", "উতোলন"], ["records", "রেকর্ড"], ["profile", "অ্যাকাউন্ট"]].map(([key, label]) => <button type="button" key={key} onClick={() => onNavigate(key)} style={{ flex: 1, background: active === key ? "#c0392b" : "transparent", border: "none", color: "#fff", padding: "9px 2px", fontSize: 12, fontWeight: active === key ? 700 : 400 }}>{label}</button>)}</nav>;
}

const labelStyle: CSSProperties = { fontSize: 13, color: "#555", marginBottom: 10 };
const fieldLabel: CSSProperties = { display: "block", fontSize: 14, fontWeight: 700, margin: "14px 0" };
const inputStyle: CSSProperties = { display: "block", width: "100%", boxSizing: "border-box", marginTop: 7, border: "1px solid #eee", borderRadius: 8, padding: "12px 14px", fontSize: 14, background: "#fafafa", outline: "none" };
const primaryButton: CSSProperties = { width: "100%", border: "none", borderRadius: 10, padding: 15, background: "#c0392b", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" };
const secondaryButton: CSSProperties = { border: "1px solid #2196f3", borderRadius: 8, padding: "9px 14px", color: "#2196f3", background: "#fff", fontWeight: 700, cursor: "pointer" };
const panelStyle: CSSProperties = { background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #eee" };
const methodCard: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 82, border: "2px solid", borderRadius: 10, padding: 8, fontWeight: 700, cursor: "pointer" };
const pillButton: CSSProperties = { border: "none", borderRadius: 20, padding: "8px 13px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" };
const cardRow: CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 10, border: "1px solid", borderRadius: 10, padding: 12, marginBottom: 9, cursor: "pointer" };
const cardDisplay: CSSProperties = { display: "flex", alignItems: "center", gap: 14, background: "#fff8ec", borderRadius: 12, padding: "14px 16px", marginBottom: 12, border: "1px solid #f0e0c0" };
const deleteButton: CSSProperties = { border: "none", background: "#ffe9e9", color: "#e53935", borderRadius: "50%", width: 32, height: 32, fontSize: 20, cursor: "pointer" };
const emptyStyle: CSSProperties = { background: "#fff", borderRadius: 12, padding: "56px 20px", textAlign: "center", color: "#4285f4", fontWeight: 700 };
const recordRow: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fff", borderRadius: 12, padding: 14, marginBottom: 10, border: "1px solid #eee" };
const tabButton: CSSProperties = { flex: 1, background: "none", border: "none", borderBottom: "2px solid transparent", padding: "12px 5px", fontSize: 13, cursor: "pointer", fontWeight: 700 };
const topLink: CSSProperties = { background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer" };
