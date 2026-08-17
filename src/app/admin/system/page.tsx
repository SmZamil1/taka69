"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings, Shield, Bell, Wallet, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Config = {
  maintenance: boolean;
  jackpot: number;
  currency: string;
  appVersion: string;
  apkUrl: string;
  referralConfig: {
    level1Rate: number;
    level2Rate: number;
    level3Rate: number;
    minDeposit: number;
    bonusAmount: number;
  };
  paymentConfig: {
    minDeposit: number;
    maxDeposit: number;
    minWithdraw: number;
    maxWithdraw: number;
    withdrawFeeType: "NONE" | "FIXED" | "PERCENT";
    withdrawFeeValue: number;
  };
};

const DEFAULT: Config = {
  maintenance: false,
  jackpot: 1000000,
  currency: "TK",
  appVersion: "1.0.0",
  apkUrl: "",
  referralConfig: { level1Rate: 5, level2Rate: 2, level3Rate: 1, minDeposit: 100, bonusAmount: 50 },
  paymentConfig: { minDeposit: 100, maxDeposit: 100000, minWithdraw: 200, maxWithdraw: 50000, withdrawFeeType: "NONE", withdrawFeeValue: 0 },
};

function Field({ label, type = "text", value, onChange, unit }: { label: string; type?: string; value: string | number | boolean; onChange: (v: string | number | boolean) => void; unit?: string; }) {
  if (type === "toggle") {
    const v = value as boolean;
    return (
      <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
        <span className="text-sm font-semibold text-white/80">{label}</span>
        <button onClick={() => onChange(!v)} className={`relative w-12 h-6 rounded-full transition-colors ${v ? "bg-emerald-500" : "bg-white/20"}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${v ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>
    );
  }
  return (
    <label className="block text-xs text-white/50">
      {label}
      <div className="relative mt-1">
        <input type={type}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/40 pr-12"
          value={value as string | number} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} />
        {unit && <span className="absolute right-3 top-2.5 text-xs text-white/30">{unit}</span>}
      </div>
    </label>
  );
}

export default function AdminSystemPage() {
  const [config, setConfig] = useState<Config>(DEFAULT);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data.config) {
          const c = j.data.config;
          setConfig({
            maintenance: c.maintenance ?? false,
            jackpot: c.jackpot ?? 1000000,
            currency: c.currency ?? "TK",
            appVersion: c.appVersion ?? "1.0.0",
            apkUrl: c.apkUrl ?? "",
            referralConfig: { ...DEFAULT.referralConfig, ...(c.referralConfig || {}) },
            paymentConfig: {
              ...DEFAULT.paymentConfig,
              ...(c.paymentConfig || {}),
              withdrawFeeType: c.paymentConfig?.withdrawFeeType || (Number(c.paymentConfig?.withdrawFee || 0) > 0 ? "PERCENT" : "NONE"),
              withdrawFeeValue: Number(c.paymentConfig?.withdrawFeeValue ?? c.paymentConfig?.withdrawFee ?? 0),
            },
          });
        }
      }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          maintenance: config.maintenance,
          jackpot: config.jackpot,
          currency: config.currency,
          appVersion: config.appVersion,
          apkUrl: config.apkUrl || null,
          referralConfig: config.referralConfig,
          paymentConfig: config.paymentConfig,
        }),
      });
      const json = await res.json();
      setMsg(json.ok ? "✅ System settings saved!" : json.error || "Save failed");
      setMsgType(json.ok ? "ok" : "err");
    } catch {
      setMsg("Network error"); setMsgType("err");
    }
    setSaving(false);
  }

  function updatePayment(k: keyof Config["paymentConfig"], v: number | "NONE" | "FIXED" | "PERCENT") {
    setConfig((p) => ({ ...p, paymentConfig: { ...p.paymentConfig, [k]: v } }));
  }
  function updateReferral(k: keyof Config["referralConfig"], v: number) {
    setConfig((p) => ({ ...p, referralConfig: { ...p.referralConfig, [k]: v } }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="rounded-full border border-white/10 bg-white/5 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">⚙️ System Control</h1>
            <p className="text-xs text-white/45">Platform settings & business rules</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="flex items-center gap-2 px-5">
          <Save className="h-4 w-4" />{saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msgType === "ok" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{msg}</div>
      )}

      {/* General */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-emerald-400" />
          <h2 className="font-black text-white">General Settings</h2>
        </div>
        <Field type="toggle" label="🚧 Maintenance Mode" value={config.maintenance} onChange={(v) => setConfig((p) => ({ ...p, maintenance: v as boolean }))} />
        <Field type="number" label="Jackpot Amount" value={config.jackpot} onChange={(v) => setConfig((p) => ({ ...p, jackpot: v as number }))} unit="TK" />
        <Field label="Currency Symbol" value={config.currency} onChange={(v) => setConfig((p) => ({ ...p, currency: v as string }))} />
        <Field label="App Version" value={config.appVersion} onChange={(v) => setConfig((p) => ({ ...p, appVersion: v as string }))} />
        <Field label="Android APK URL" value={config.apkUrl} onChange={(v) => setConfig((p) => ({ ...p, apkUrl: v as string }))} />
      </section>

      {/* Payment */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4 text-amber-400" />
          <h2 className="font-black text-white">Payment Rules</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field type="number" label="Min Deposit" value={config.paymentConfig.minDeposit} unit="TK" onChange={(v) => updatePayment("minDeposit", v as number)} />
          <Field type="number" label="Max Deposit" value={config.paymentConfig.maxDeposit} unit="TK" onChange={(v) => updatePayment("maxDeposit", v as number)} />
          <Field type="number" label="Min Withdraw" value={config.paymentConfig.minWithdraw} unit="TK" onChange={(v) => updatePayment("minWithdraw", v as number)} />
          <Field type="number" label="Max Withdraw" value={config.paymentConfig.maxWithdraw} unit="TK" onChange={(v) => updatePayment("maxWithdraw", v as number)} />
          <label className="block text-xs text-white/50">
            Withdraw Fee Type
            <select value={config.paymentConfig.withdrawFeeType} onChange={(e) => updatePayment("withdrawFeeType", e.target.value as Config["paymentConfig"]["withdrawFeeType"])} className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-emerald-400/40">
              <option value="NONE">No fee</option>
              <option value="FIXED">Fixed TK</option>
              <option value="PERCENT">Percent</option>
            </select>
          </label>
          <Field type="number" label="Withdraw Fee" value={config.paymentConfig.withdrawFeeValue} unit={config.paymentConfig.withdrawFeeType === "PERCENT" ? "%" : "TK"} onChange={(v) => updatePayment("withdrawFeeValue", v as number)} />
        </div>
      </section>

      {/* Referral */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-purple-400" />
          <h2 className="font-black text-white">Referral Commission</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field type="number" label="Level 1 Rate %" value={config.referralConfig.level1Rate} unit="%" onChange={(v) => updateReferral("level1Rate", v as number)} />
          <Field type="number" label="Level 2 Rate %" value={config.referralConfig.level2Rate} unit="%" onChange={(v) => updateReferral("level2Rate", v as number)} />
          <Field type="number" label="Level 3 Rate %" value={config.referralConfig.level3Rate} unit="%" onChange={(v) => updateReferral("level3Rate", v as number)} />
          <Field type="number" label="Referral Bonus" value={config.referralConfig.bonusAmount} unit="TK" onChange={(v) => updateReferral("bonusAmount", v as number)} />
          <Field type="number" label="Min Deposit for Bonus" value={config.referralConfig.minDeposit} unit="TK" onChange={(v) => updateReferral("minDeposit", v as number)} />
        </div>
      </section>
    </div>
  );
}
