"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Config = {
  maintenance: boolean; jackpot: number; currency: string;
  paymentConfig: {
    minDeposit: number; minWithdraw: number; maxDeposit: number; maxWithdraw: number;
    noticeEn: string; noticeBn: string;
    methods: Array<{ id: string; name: string; number: string; type: string }>;
  };
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/settings", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setConfig(json.data);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify(config),
    });
    const json = await res.json();
    if (json.ok) toast.success("Settings saved ✓");
    else toast.error(json.error || "Failed");
    setSaving(false);
  }

  if (!config) return <div className="py-12 text-center text-white/40">Loading...</div>;

  const pc = config.paymentConfig;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-amber-300">Settings</h1>

      {/* Maintenance */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
        <h2 className="font-bold text-white mb-4">Site Control</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setConfig(c => c ? { ...c, maintenance: !c.maintenance } : c)}
            className={cn("relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
              config.maintenance ? "bg-rose-500" : "bg-emerald-500"
            )}>
            <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              config.maintenance ? "translate-x-8" : "translate-x-1"
            )} />
          </button>
          <div>
            <div className="font-bold text-white">Maintenance Mode</div>
            <div className="text-xs text-white/40">
              {config.maintenance ? "🔴 Site is under maintenance" : "🟢 Site is live"}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3 items-center">
          <label className="text-xs text-white/40">Jackpot TK</label>
          <Input type="number" value={config.jackpot} className="w-40"
            onChange={e => setConfig(c => c ? { ...c, jackpot: Number(e.target.value) } : c)} />
        </div>
      </div>

      {/* Payment config */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
        <h2 className="font-bold text-white">Payment Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Min Deposit", "minDeposit"], ["Min Withdraw", "minWithdraw"],
            ["Max Deposit", "maxDeposit"], ["Max Withdraw", "maxWithdraw"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-[11px] text-white/40">{label} TK</label>
              <Input type="number" value={(pc as Record<string,number|string>)[key] as number}
                onChange={e => setConfig(c => c ? { ...c, paymentConfig: { ...c.paymentConfig, [key]: Number(e.target.value) } } : c)} />
            </div>
          ))}
        </div>
        <div>
          <label className="text-[11px] text-white/40">Notice (EN)</label>
          <Input value={pc.noticeEn}
            onChange={e => setConfig(c => c ? { ...c, paymentConfig: { ...c.paymentConfig, noticeEn: e.target.value } } : c)} />
        </div>
        <div>
          <label className="text-[11px] text-white/40">Notice (BN)</label>
          <Input value={pc.noticeBn}
            onChange={e => setConfig(c => c ? { ...c, paymentConfig: { ...c.paymentConfig, noticeBn: e.target.value } } : c)} />
        </div>

        <div>
          <h3 className="font-bold text-white text-sm mb-3">Payment Method Numbers</h3>
          <div className="space-y-2">
            {pc.methods.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-white w-20">{m.name}</span>
                <Input placeholder="01XXXXXXXXX" value={m.number}
                  onChange={e => setConfig(c => {
                    if (!c) return c;
                    const methods = [...c.paymentConfig.methods];
                    methods[i] = { ...methods[i], number: e.target.value };
                    return { ...c, paymentConfig: { ...c.paymentConfig, methods } };
                  })} />
                <span className="text-xs text-white/30">{m.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button variant="gold" className="w-full font-black" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
