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
    methods: Array<{ id: string; name: string; number: string; type: string }>;
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
  const br = config.brandConfig || {
    siteName: "TAKA69",
    logoUrl: "/icons/logo.png",
    faviconUrl: "/icons/favicon-32.png",
    telegramUrl: "https://t.me/",
    whatsappUrl: "https://wa.me/",
  };

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

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-5 space-y-2">
        <h2 className="font-bold text-emerald-200">Fairness protection</h2>
        <p className="text-xs text-white/55 leading-relaxed">
          Bet totals, house thresholds, and admin settings never force losses or alter game outcomes.
          WinGo, Crash, and Aviator use independent fair generation; only lifecycle, betting, payout, and risk limits remain configurable in their dedicated controls.
        </p>
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
          <div>
            <h3 className="font-bold text-white text-sm mb-3">Payment Method Numbers</h3>
            <div className="space-y-2">
              {pc.methods.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white w-20">{m.name}</span>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={m.number}
                    onChange={(e) =>
                      setConfig((c) => {
                        if (!c) return c;
                        const methods = [...c.paymentConfig.methods];
                        methods[i] = { ...methods[i], number: e.target.value };
                        return { ...c, paymentConfig: { ...c.paymentConfig, methods } };
                      })
                    }
                  />
                  <span className="text-xs text-white/30">{m.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button variant="gold" className="w-full font-black" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
