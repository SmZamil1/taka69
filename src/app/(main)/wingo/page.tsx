"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { Timer, TrendingUp, History, ChevronLeft, ChevronRight } from "lucide-react";

type WingoGame = "WINGO1" | "WINGO3" | "WINGO5" | "WINGO10";
type HistoryItem = { period: number; result: number; colors: string[]; size: string; closedAt: string };
type Round = { id: string; period: number; startedAt: string; remainingMs: number };

const GAMES: { key: WingoGame; label: string; labelBn: string }[] = [
  { key: "WINGO1",  label: "1 Min",  labelBn: "১ মিনিট" },
  { key: "WINGO3",  label: "3 Min",  labelBn: "৩ মিনিট" },
  { key: "WINGO5",  label: "5 Min",  labelBn: "৫ মিনিট" },
  { key: "WINGO10", label: "10 Min", labelBn: "১০ মিনিট" },
];

const COLOR_BETS = [
  { id: "green",  label: "Green",  labelBn: "সবুজ",  multiplier: "2x", bg: "from-green-600 to-green-500", numbers: [1,3,7,9] },
  { id: "violet", label: "Violet", labelBn: "বেগুনি", multiplier: "4.5x", bg: "from-purple-600 to-purple-500", numbers: [0,5] },
  { id: "red",    label: "Red",    labelBn: "লাল",   multiplier: "2x", bg: "from-red-600 to-red-500", numbers: [2,4,6,8] },
];

const SIZE_BETS = [
  { id: "big",   label: "Big",   labelBn: "বড়",  multiplier: "2x", numbers: [5,6,7,8,9] },
  { id: "small", label: "Small", labelBn: "ছোট", multiplier: "2x", numbers: [0,1,2,3,4] },
];

const NUM_COLORS: Record<number, string[]> = {
  0: ["red","violet"], 1: ["green"], 2: ["red"], 3: ["green"], 4: ["red"],
  5: ["green","violet"], 6: ["red"], 7: ["green"], 8: ["red"], 9: ["green"],
};

function NumberBadge({ n, size = "md" }: { n: number; size?: "sm" | "md" | "lg" }) {
  const colors = NUM_COLORS[n] ?? ["white"];
  const bg =
    colors.includes("violet")
      ? "from-purple-600 to-red-500"
      : colors.includes("red")
      ? "from-red-600 to-red-400"
      : "from-green-600 to-green-400";
  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-full font-black bg-gradient-to-br text-white",
      size === "sm" ? "w-6 h-6 text-xs" : size === "lg" ? "w-10 h-10 text-lg" : "w-8 h-8 text-sm",
      bg
    )}>
      {n}
    </span>
  );
}

export default function WingoPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
  const toast = useToast();

  const [game, setGame] = useState<WingoGame>("WINGO1");
  const [round, setRound] = useState<Round | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [betSelection, setBetSelection] = useState<string | null>(null);
  const [amount, setAmount] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [tab, setTab] = useState<"chart" | "myBets">("chart");
  const [myBets, setMyBets] = useState<unknown[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

  const fetchRound = useCallback(async () => {
    try {
      const res = await fetch(`/api/wingo?game=${game}`, { credentials: "include" });
      const json = await res.json();
      if (!json.ok) return;
      setRound(json.data.current);
      setHistory(json.data.history || []);
      setRemaining(json.data.current?.remainingMs ?? 0);
    } catch { /* */ }
  }, [game]);

  useEffect(() => {
    fetchRound();
    const id = setInterval(fetchRound, 5000);
    return () => clearInterval(id);
  }, [fetchRound]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [round?.id]);

  async function placeBet() {
    if (!betSelection) { toast.error(t("Select a bet first", "আগে বেট সিলেক্ট করুন")); return; }
    if (!user) { toast.error(t("Login required", "লগইন করুন")); return; }
    setPlacing(true);
    try {
      const res = await fetch("/api/wingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game, bet: betSelection, amount }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(
          t("Bet placed!", "বেট হয়েছে!"),
          t(`${betSelection.toUpperCase()} — ${amount} TK`, `${betSelection.toUpperCase()} — ${amount} টাকা`)
        );
        setBetSelection(null);
      } else {
        toast.error(t("Failed", "ব্যর্থ"), json.error);
      }
    } catch {
      toast.error(t("Network error", "নেটওয়ার্ক ত্রুটি"));
    }
    setPlacing(false);
  }

  const secs = Math.floor(remaining / 1000);
  const mins = Math.floor(secs / 60);
  const secDisplay = String(secs % 60).padStart(2, "0");
  const bettingClosed = remaining < 5000;

  return (
    <div className="mx-auto max-w-lg space-y-3 pb-20">
      {/* ── Game selector ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GAMES.map((g) => (
          <button
            key={g.key}
            onClick={() => { setGame(g.key); setBetSelection(null); }}
            className={cn(
              "flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition",
              game === g.key
                ? "bg-amber-400 text-emerald-950 shadow"
                : "bg-white/8 text-white/70 hover:bg-white/14"
            )}
          >
            {lang === "bn" ? g.labelBn : g.label}
          </button>
        ))}
      </div>

      {/* ── Timer card ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{t("Period", "পিরিয়ড")}</div>
            <div className="text-lg font-black text-white">#{round?.period ?? "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">{t("Time Left", "বাকি সময়")}</div>
            <div className={cn(
              "text-3xl font-black tabular-nums",
              bettingClosed ? "text-rose-400 animate-pulse" : remaining < 15000 ? "text-amber-400" : "text-white"
            )}>
              {mins > 0 ? `${mins}:${secDisplay}` : `0:${secDisplay}`}
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              bettingClosed ? "bg-rose-500" : remaining < 15000 ? "bg-amber-400" : "bg-emerald-500"
            )}
            style={{ width: round ? `${Math.min(100, (remaining / (parseInt(game.replace("WINGO","")) * 60000)) * 100)}%` : "0%" }}
          />
        </div>

        {bettingClosed && (
          <div className="mt-2 text-center text-xs font-bold text-rose-400 animate-pulse">
            {t("Betting Closed", "বেটিং বন্ধ")}
          </div>
        )}
      </div>

      {/* ── Last 20 results ── */}
      <div className="flex flex-wrap gap-1.5">
        {history.slice(0, 20).map((h) => (
          <NumberBadge key={h.period} n={h.result} size="sm" />
        ))}
      </div>

      {/* ── Bet panel ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 p-4 space-y-4">
        {/* Color bets */}
        <div className="grid grid-cols-3 gap-2">
          {COLOR_BETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBetSelection(betSelection === b.id ? null : b.id)}
              disabled={bettingClosed}
              className={cn(
                "rounded-xl py-3 text-center text-xs font-black text-white transition bg-gradient-to-br",
                b.bg,
                betSelection === b.id ? "ring-2 ring-white scale-105 shadow-lg" : "opacity-80 hover:opacity-100",
                bettingClosed && "opacity-30 cursor-not-allowed"
              )}
            >
              <div>{lang === "bn" ? b.labelBn : b.label}</div>
              <div className="text-[10px] opacity-70 font-normal">{b.multiplier}</div>
            </button>
          ))}
        </div>

        {/* Number grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              onClick={() => setBetSelection(betSelection === String(i) ? null : String(i))}
              disabled={bettingClosed}
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center transition",
                betSelection === String(i) ? "ring-2 ring-white scale-110" : "hover:scale-105",
                bettingClosed && "opacity-30 cursor-not-allowed"
              )}
            >
              <NumberBadge n={i} size="md" />
            </button>
          ))}
        </div>

        {/* Size bets */}
        <div className="grid grid-cols-2 gap-2">
          {SIZE_BETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBetSelection(betSelection === b.id ? null : b.id)}
              disabled={bettingClosed}
              className={cn(
                "rounded-xl py-3 text-center text-sm font-black text-white bg-white/10 border transition",
                betSelection === b.id ? "border-amber-400 bg-amber-400/20 scale-105" : "border-white/10 hover:bg-white/15",
                bettingClosed && "opacity-30 cursor-not-allowed"
              )}
            >
              <div>{lang === "bn" ? b.labelBn : b.label}</div>
              <div className="text-[10px] text-white/50 font-normal">{b.multiplier}</div>
            </button>
          ))}
        </div>

        {/* Amount picker */}
        <div>
          <div className="mb-2 text-[11px] text-white/40 uppercase tracking-wider">{t("Bet Amount (TK)", "বেটের পরিমাণ (TK)")}</div>
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  amount === a ? "bg-amber-400 text-emerald-950" : "bg-white/10 text-white hover:bg-white/15"
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min={10}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              onClick={() => setAmount((a) => a * 2)}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
            >2x</button>
            <button
              onClick={() => setAmount((a) => Math.max(10, Math.floor(a / 2)))}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
            >½</button>
          </div>
        </div>

        {/* Place bet */}
        <button
          onClick={placeBet}
          disabled={placing || bettingClosed || !betSelection}
          className={cn(
            "w-full rounded-xl py-4 text-sm font-black transition",
            betSelection && !bettingClosed
              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 hover:opacity-90 shadow-lg"
              : "bg-white/10 text-white/40 cursor-not-allowed"
          )}
        >
          {placing
            ? t("Placing...", "বেট হচ্ছে...")
            : bettingClosed
            ? t("Wait for next round", "পরের রাউন্ডের জন্য অপেক্ষা করুন")
            : betSelection
            ? `${t("Bet", "বেট")} ${betSelection.toUpperCase()} — ${amount} TK`
            : t("Select a bet above", "উপরে একটি বেট সিলেক্ট করুন")}
        </button>
      </div>

      {/* ── History table ── */}
      <div className="rounded-2xl border border-white/10 bg-surface-900 overflow-hidden">
        <div className="flex border-b border-white/10">
          {(["chart","myBets"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={cn(
                "flex-1 py-3 text-xs font-bold transition",
                tab === tb ? "bg-white/8 text-white" : "text-white/40 hover:text-white"
              )}
            >
              {tb === "chart" ? t("All Results", "সব ফলাফল") : t("My Bets", "আমার বেট")}
            </button>
          ))}
        </div>

        {tab === "chart" && (
          <div className="divide-y divide-white/5">
            {history.map((h) => (
              <div key={h.period} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-white/40">#{h.period}</span>
                <NumberBadge n={h.result} size="sm" />
                <div className="flex gap-1">
                  {h.colors.map((c) => (
                    <span key={c} className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold capitalize",
                      c === "red" ? "bg-red-500/20 text-red-300" :
                      c === "green" ? "bg-green-500/20 text-green-300" :
                      "bg-purple-500/20 text-purple-300"
                    )}>{c}</span>
                  ))}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50 capitalize">{h.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "myBets" && (
          <div className="p-4 text-center text-xs text-white/40">
            {user ? t("Your bet history coming soon", "আপনার বেট ইতিহাস শীঘ্রই আসছে") : t("Login to see your bets", "বেট দেখতে লগইন করুন")}
          </div>
        )}
      </div>
    </div>
  );
}
