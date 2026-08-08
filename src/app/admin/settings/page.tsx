"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminSettingsPage() {
  const [jackpot, setJackpot] = useState(0);
  const [maintenance, setMaintenance] = useState(false);
  const [textEn, setTextEn] = useState("");
  const [textBn, setTextBn] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setJackpot(j.data.config.jackpot);
          setMaintenance(j.data.config.maintenance);
        }
      });
  }, []);

  async function save(extra: Record<string, unknown> = {}) {
    setMsg("");
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ jackpot, maintenance, ...extra }),
    });
    const json = await res.json();
    setMsg(json.ok ? "Saved" : json.error);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-black text-gold-400">Settings</h1>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <label className="block text-sm text-emerald-200/70">Jackpot display</label>
        <Input
          type="number"
          value={jackpot}
          onChange={(e) => setJackpot(Number(e.target.value))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
          />
          Maintenance mode
        </label>
        <Button onClick={() => save()}>Save config</Button>
      </div>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <h2 className="font-bold">New announcement</h2>
        <Input placeholder="English" value={textEn} onChange={(e) => setTextEn(e.target.value)} />
        <Input placeholder="Bangla" value={textBn} onChange={(e) => setTextBn(e.target.value)} />
        <Button
          variant="gold"
          onClick={() => {
            if (!textEn || !textBn) return;
            save({ announcement: { textEn, textBn, active: true } });
            setTextEn("");
            setTextBn("");
          }}
        >
          Publish
        </Button>
      </div>

      {msg && <p className="text-gold-300 text-sm">{msg}</p>}

      <p className="text-xs text-emerald-200/40 leading-relaxed">
        TAKA69 is play-money only. Do not configure real payment gateways or cash
        withdrawals in this project.
      </p>
    </div>
  );
}
