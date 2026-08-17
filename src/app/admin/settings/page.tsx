"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type BrandConfig = {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  telegramUrl: string;
  whatsappUrl: string;
};

type Config = {
  maintenance: boolean;
  jackpot: number;
  currency: string;
  paymentConfig: {
    minDeposit: number;
    minWithdraw: number;
    maxDeposit: number;
    maxWithdraw: number;
    noticeEn: string;
    noticeBn: string;
    withdrawFeeType?: "NONE" | "FIXED" | "PERCENT";
    withdrawFeeValue?: number;
    methods: Array<{
      id: string; name: string; number: string; type?: string; enabled?: boolean; depositEnabled?: boolean; withdrawEnabled?: boolean;
      logo?: string; accountName?: string; instructionsEn?: string; instructionsBn?: string; warningEn?: string; warningBn?: string;
      feeType?: "NONE" | "FIXED" | "PERCENT"; feeValue?: number; channels?: { id: string; label: string; bonus?: number }[];
    }>;
  };
  houseRuleConfig: {
    enabled: boolean;
    thresholdAmount: number;
    windowMinutes: number;
  };
  brandConfig: BrandConfig;
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    // Prefer full admin config (has houseRule + popup fields)
    const res = await fetch("/api/admin/config", { credentials: "include" });
    const json = await res.json();
    if (json.ok && json.data?.config) {
      const c = json.data.config;
      setConfig({
        maintenance: !!c.maintenance,
        jackpot: c.jackpot ?? 0,
        currency: c.currency || "BDT",
        paymentConfig: c.paymentConfig || {
          minDeposit: 100,
          minWithdraw: 200,
          maxDeposit: 100000,
          maxWithdraw: 50000,
          noticeEn: "",
          noticeBn: "",
          methods: [],
        },
        houseRuleConfig: c.houseRuleConfig || {
          enabled: true,
          thresholdAmount: 15000,
          windowMinutes: 60,
        },
        brandConfig: c.brandConfig || {
          siteName: "TAKA69",
          logoUrl: "/icons/logo.png",
          faviconUrl: "/icons/favicon-32.png",
          telegramUrl: "https://t.me/",
          whatsappUrl: "https://wa.me/",
        },
      });
      return;
    }
    const res2 = await fetch("/api/admin/settings", { credentials: "include" });
    const j2 = await res2.json();
    if (j2.ok) {
      setConfig({
        ...j2.data,
        currency: j2.data.currency || "BDT",
        houseRuleConfig: j2.data.houseRuleConfig || {
          enabled: true,
          thresholdAmount: 15000,
          windowMinutes: 60,
        },
        brandConfig: j2.data.brandConfig || {
          siteName: "TAKA69",
          logoUrl: "/icons/logo.png",
          faviconUrl: "/icons/favicon-32.png",
          telegramUrl: "https://t.me/",
          whatsappUrl: "https://wa.me/",
        },
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        maintenance: config.maintenance,
        jackpot: config.jackpot,
        currency: config.currency || "BDT",
        paymentConfig: config.paymentConfig,
        houseRuleConfig: config.houseRuleConfig,
        brandConfig: config.brandConfig,
      }),
    });
    const json = await res.json();
    if (json.ok) toast.success("Settings saved ✓");
    else toast.error(json.error || "Failed");
    setSaving(false);
  }

  if (!config) return <div className="py-12 text-center text-white/40">Loading...</div>;

  const pc = config.paymentConfig;
  const hr = config.houseRuleConfig || { enabled: true, thresholdAmount: 15000, windowMinutes: 60 };
  const br = config.brandConfig || {
    siteName: "TAKA69",
    logoUrl: "/icons/logo.png",
    faviconUrl: "/icons/favicon-32.png",
    telegramUrl: "https://t.me/",
    whatsappUrl: "https://wa.me/",
  };

  function updateMethod(index: number, patch: Record<string, unknown>) {
    setConfig((current) => {
      if (!current) return current;
      const methods = [...current.paymentConfig.methods];
      methods[index] = { ...methods[index], ...patch };
      return { ...current, paymentConfig: { ...current.paymentConfig, methods } };
    });
  }

  function setBrand<K extends keyof BrandConfig>(key: K, value: BrandConfig[K]) {
    setConfig((c) =>
      c
        ? {
            ...c,
            brandConfig: { ...(c.brandConfig || br), [key]: value },
          }
        : c
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-amber-300">Settings</h1>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <h2 className="font-bold text-amber-200">Branding & social links</h2>
        <p className="text-xs text-white/45">
          Site name, logo and favicon apply site-wide. Telegram/WhatsApp power the floating support stack.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-white/50">
            Website name
            <Input className="mt-1" value={br.siteName} onChange={(e) => setBrand("siteName", e.target.value)} />
          </label>
          <label className="text-xs text-white/50">
            Logo URL
            <Input className="mt-1" value={br.logoUrl} onChange={(e) => setBrand("logoUrl", e.target.value)} />
          </label>
          <label className="text-xs text-white/50">
            Favicon URL
            <Input className="mt-1" value={br.faviconUrl} onChange={(e) => setBrand("faviconUrl", e.target.value)} />
          </label>
          <label className="text-xs text-white/50">
            Telegram URL
            <Input className="mt-1" value={br.telegramUrl} onChange={(e) => setBrand("telegramUrl", e.target.value)} />
          </label>
          <label className="text-xs text-white/50 sm:col-span-2">
            WhatsApp URL
            <Input className="mt-1" value={br.whatsappUrl} onChange={(e) => setBrand("whatsappUrl", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
        <h2 className="font-bold text-white mb-4">Site Control</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig((c) => (c ? { ...c, maintenance: !c.maintenance } : c))}
            className={cn(
              "relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
              config.maintenance ? "bg-rose-500" : "bg-emerald-500"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                config.maintenance ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>
          <div>
            <div className="font-bold text-white">Maintenance Mode</div>
            <div className="text-xs text-white/40">
              {config.maintenance ? "🔴 Site is under maintenance" : "🟢 Site is live"}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <label className="text-xs text-white/40">Jackpot BDT</label>
          <Input
            type="number"
            value={config.jackpot}
            className="w-40"
            onChange={(e) =>
              setConfig((c) => (c ? { ...c, jackpot: Number(e.target.value) } : c))
            }
          />
          <label className="text-xs text-white/40">Currency</label>
          <Input
            value={config.currency || "BDT"}
            className="w-24"
            onChange={(e) => setConfig((c) => (c ? { ...c, currency: e.target.value } : c))}
          />
        </div>
      </div>

      {/* Global house threshold */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-3">
        <h2 className="font-bold text-rose-200">Global House Rule</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          When total bets from all users (last N minutes) reach the threshold, force house edge —
          players lose bets / low-win mode on all games.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setConfig((c) =>
                c
                  ? {
                      ...c,
                      houseRuleConfig: {
                        ...hr,
                        enabled: !hr.enabled,
                      },
                    }
                  : c
              )
            }
            className={cn(
              "relative inline-flex h-7 w-14 items-center rounded-full",
              hr.enabled ? "bg-rose-500" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                hr.enabled ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>
          <span className="text-sm font-bold text-white">
            {hr.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-white/40">Threshold amount (BDT)</label>
            <Input
              type="number"
              value={hr.thresholdAmount}
              onChange={(e) =>
                setConfig((c) =>
                  c
                    ? {
                        ...c,
                        houseRuleConfig: {
                          ...hr,
                          thresholdAmount: Number(e.target.value) || 0,
                        },
                      }
                    : c
                )
              }
            />
            <p className="mt-1 text-[10px] text-white/30">Default 15000 — all users combined bets</p>
          </div>
          <div>
            <label className="text-[11px] text-white/40">Window (minutes)</label>
            <Input
              type="number"
              value={hr.windowMinutes}
              onChange={(e) =>
                setConfig((c) =>
                  c
                    ? {
                        ...c,
                        houseRuleConfig: {
                          ...hr,
                          windowMinutes: Number(e.target.value) || 60,
                        },
                      }
                    : c
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
        <h2 className="font-bold text-white">Payment Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Min Deposit", "minDeposit"],
              ["Min Withdraw", "minWithdraw"],
              ["Max Deposit", "maxDeposit"],
              ["Max Withdraw", "maxWithdraw"],
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <label className="text-[11px] text-white/40">{label} BDT</label>
              <Input
                type="number"
                value={pc[key]}
                onChange={(e) =>
                  setConfig((c) =>
                    c
                      ? {
                          ...c,
                          paymentConfig: {
                            ...c.paymentConfig,
                            [key]: Number(e.target.value),
                          },
                        }
                      : c
                  )
                }
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-[11px] text-white/40">Notice (EN)</label>
          <Input
            value={pc.noticeEn || ""}
            onChange={(e) =>
              setConfig((c) =>
                c
                  ? {
                      ...c,
                      paymentConfig: { ...c.paymentConfig, noticeEn: e.target.value },
                    }
                  : c
              )
            }
          />
        </div>
        <div>
          <label className="text-[11px] text-white/40">Notice (BN)</label>
          <Input
            value={pc.noticeBn || ""}
            onChange={(e) =>
              setConfig((c) =>
                c
                  ? {
                      ...c,
                      paymentConfig: { ...c.paymentConfig, noticeBn: e.target.value },
                    }
                  : c
              )
            }
          />
        </div>

        {Array.isArray(pc.methods) && pc.methods.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Payment methods</h3>
            {pc.methods.map((m, i) => (
              <div key={m.id} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2"><span className="font-black text-white">{m.name}</span><span className="text-[10px] text-white/40">{m.id}</span></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Account / wallet number" value={m.number || ""} onChange={(e) => updateMethod(i, { number: e.target.value })} />
                  <Input placeholder="Account owner name" value={m.accountName || ""} onChange={(e) => updateMethod(i, { accountName: e.target.value })} />
                  <Input placeholder="Logo path, e.g. /payments/bkash.png" value={m.logo || ""} onChange={(e) => updateMethod(i, { logo: e.target.value })} />
                  <Input placeholder="Account type" value={m.type || ""} onChange={(e) => updateMethod(i, { type: e.target.value })} />
                  <Input placeholder="Channels, comma separated" value={(m.channels || []).map((c) => c.label).join(", ")} onChange={(e) => updateMethod(i, { channels: e.target.value.split(",").map((label) => label.trim()).filter(Boolean).map((label, n) => ({ id: `${m.id}-${n + 1}`, label, bonus: 0 })) })} />
                  <Input placeholder="Warning in Bengali" value={m.warningBn || ""} onChange={(e) => updateMethod(i, { warningBn: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
                  {[["enabled", "Enabled"], ["depositEnabled", "Deposit"], ["withdrawEnabled", "Withdraw"]].map(([key, label]) => <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={m[key as "enabled" | "depositEnabled" | "withdrawEnabled"] !== false} onChange={(e) => updateMethod(i, { [key]: e.target.checked })} />{label}</label>)}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select value={m.feeType || "NONE"} onChange={(e) => updateMethod(i, { feeType: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"><option value="NONE">No method fee</option><option value="FIXED">Fixed fee</option><option value="PERCENT">Percent fee</option></select>
                  <Input type="number" min={0} placeholder="Fee value" value={m.feeValue ?? 0} onChange={(e) => updateMethod(i, { feeValue: Number(e.target.value) || 0 })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="gold" className="w-full font-black" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
