"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const refresh = useAuthStore((s) => s.refresh);
  const t = useLang((s) => s.t);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/wallet", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.ok && setTxs(j.data.transactions));
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
    if (!json.ok) setMsg(json.error);
    else {
      setBalance(json.data.balance);
      setMsg(t(`+${json.data.bonus} TC claimed!`, `+${json.data.bonus} টিসি পেয়েছেন!`));
      refresh();
      const w = await fetch("/api/wallet", { credentials: "include" }).then((r) => r.json());
      if (w.ok) setTxs(w.data.transactions);
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="card text-center space-y-3">
        <p>{t("Login to view wallet", "ওয়ালেট দেখতে লগইন করুন")}</p>
        <Link href="/login"><Button>{t("Login", "লগইন")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-br from-emerald-800 to-surface-950 text-center">
        <div className="text-xs uppercase tracking-widest text-emerald-200/70">
          {t("Balance (play money)", "ব্যালেন্স (প্লে-মানি)")}
        </div>
        <div className="mt-1 text-4xl font-black text-gold-300">
          {formatCoins(user.balance)} <span className="text-lg">TC</span>
        </div>
        <p className="mt-2 text-[11px] text-emerald-200/50">
          {t("TC = Taka Coins · no cash value", "TC = টাকা কয়েন · নগদ মূল্য নেই")}
        </p>
        <Button
          variant="gold"
          className="mt-4 w-full"
          onClick={claimDaily}
          disabled={loading}
        >
          {t("Claim daily 500 TC", "দৈনিক ৫০০ টিসি নিন")}
        </Button>
        {msg && <p className="mt-2 text-sm text-gold-300">{msg}</p>}
      </div>

      <div className="card">
        <h2 className="mb-3 font-bold">{t("Transactions", "লেনদেন")}</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {txs.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{tx.type}</div>
                <div className="text-[10px] text-emerald-200/50">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={tx.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {tx.amount >= 0 ? "+" : ""}
                {formatCoins(tx.amount)}
              </div>
            </div>
          ))}
          {!txs.length && (
            <p className="text-sm text-emerald-200/50">{t("No transactions yet", "এখনো লেনদেন নেই")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
