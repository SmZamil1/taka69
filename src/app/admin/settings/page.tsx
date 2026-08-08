"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_GAME_CONFIG, type GameCode } from "@/lib/game-config";

export default function AdminSettingsPage() {
  // Banners/popup UI moved to /admin/banners — keep JSON sync for backward compatibility

  const [jackpot, setJackpot] = useState(0);
  const [maintenance, setMaintenance] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [textEn, setTextEn] = useState("");
  const [textBn, setTextBn] = useState("");
  const [msg, setMsg] = useState("");
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);
  const [selectedGame, setSelectedGame] = useState<GameCode>("crash");
  const [bannersJson, setBannersJson] = useState("[]");
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupImage, setPopupImage] = useState("/banners/welcome.jpg");
  const [popupHref, setPopupHref] = useState("/promotions");
  const [popupTitleEn, setPopupTitleEn] = useState("Welcome offer");
  const [popupTitleBn, setPopupTitleBn] = useState("স্বাগতম অফার");
  const [popupBodyEn, setPopupBodyEn] = useState("Deposit and get admin bonus on approval.");
  const [popupBodyBn, setPopupBodyBn] = useState("ডিপোজিট করুন — অনুমোদনে অ্যাডমিন বোনাস।");
  const [refBonus, setRefBonus] = useState(500);
  const [payBkash, setPayBkash] = useState("01XXXXXXXXX");
  const [payNagad, setPayNagad] = useState("01XXXXXXXXX");

  useEffect(() => {
    fetch("/api/admin/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const c = j.data.config;
        setJackpot(c.jackpot);
        setMaintenance(c.maintenance);
        setApkUrl(c.apkUrl || "");
        setAppVersion(c.appVersion || "1.0.0");
        if (c.gameConfig) setGameConfig(c.gameConfig);
        setBannersJson(JSON.stringify(c.banners || [], null, 2));
        const p = c.popupConfig || {};
        setPopupEnabled(!!p.enabled);
        setPopupImage(p.imageUrl || "/banners/welcome.jpg");
        setPopupHref(p.href || "/promotions");
        setPopupTitleEn(p.titleEn || "Welcome offer");
        setPopupTitleBn(p.titleBn || "স্বাগতম অফার");
        setPopupBodyEn(p.bodyEn || "");
        setPopupBodyBn(p.bodyBn || "");
        setRefBonus(c.referralConfig?.bonusAmount || 500);
        const methods = c.paymentConfig?.methods || [];
        const bk = methods.find((m: { id: string }) => m.id === "bkash");
        const ng = methods.find((m: { id: string }) => m.id === "nagad");
        if (bk?.number) setPayBkash(bk.number);
        if (ng?.number) setPayNagad(ng.number);
      });
  }, []);

  async function save(extra: Record<string, unknown> = {}) {
    setMsg("");
    let banners: unknown = undefined;
    try {
      banners = JSON.parse(bannersJson);
    } catch {
      setMsg("Invalid banners JSON");
      return;
    }
    const paymentConfig = {
      noticeEn: "Virtual play-money TK only. Admin reviews every request.",
      noticeBn: "শুধু ভার্চুয়াল প্লে-মানি TK। অ্যাডমিন প্রতিটি রিকোয়েস্ট রিভিউ করে।",
      minDeposit: 100,
      minWithdraw: 200,
      maxDeposit: 100000,
      maxWithdraw: 50000,
      methods: [
        { id: "bkash", name: "bKash", color: "#E2136E", logo: "/payments/bkash.svg", number: payBkash, type: "Personal" },
        { id: "nagad", name: "Nagad", color: "#F15A29", logo: "/payments/nagad.svg", number: payNagad, type: "Personal" },
        { id: "rocket", name: "Rocket", color: "#8B2C8A", logo: "/payments/rocket.svg", number: payBkash, type: "Personal" },
        { id: "upay", name: "Upay", color: "#F9A825", logo: "/payments/upay.svg", number: payNagad, type: "Personal" },
      ],
    };
    const popupConfig = {
      enabled: popupEnabled,
      imageUrl: popupImage,
      href: popupHref,
      titleEn: popupTitleEn,
      titleBn: popupTitleBn,
      bodyEn: popupBodyEn,
      bodyBn: popupBodyBn,
      showOncePerSession: true,
    };
    const referralConfig = {
      enabled: true,
      bonusAmount: refBonus,
      minDepositForBonus: 100,
      shareTextEn: "Play TAKA69 with my code and get started!",
      shareTextBn: "আমার কোড দিয়ে TAKA69 খেলুন!",
    };

    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        jackpot,
        maintenance,
        apkUrl,
        appVersion,
        currency: "TK",
        gameConfig,
        banners,
        paymentConfig,
        popupConfig,
        referralConfig,
        ...extra,
      }),
    });
    const json = await res.json();
    setMsg(json.ok ? "Saved" : json.error);
  }

  const g = gameConfig[selectedGame];

  function updateGame(field: string, value: number | boolean) {
    setGameConfig((prev) => ({
      ...prev,
      [selectedGame]: { ...prev[selectedGame], [field]: value },
    }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-gold-400">Settings</h1>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <label className="block text-sm text-emerald-200/70">Jackpot display</label>
        <Input type="number" value={jackpot} onChange={(e) => setJackpot(Number(e.target.value))} />
        <label className="block text-sm text-emerald-200/70">APK download URL</label>
        <Input value={apkUrl} onChange={(e) => setApkUrl(e.target.value)} placeholder="https://.../taka69.apk" />
        <label className="block text-sm text-emerald-200/70">App version</label>
        <Input value={appVersion} onChange={(e) => setAppVersion(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
          Maintenance mode
        </label>
      </div>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <h2 className="font-bold text-gold-300">Game limits / big prize (per game)</h2>
        <select
          className="w-full rounded-xl border border-emerald-700 bg-black/40 px-3 py-2 text-sm"
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value as GameCode)}
        >
          {Object.keys(gameConfig).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Min bet<input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.minBet} onChange={(e) => updateGame("minBet", Number(e.target.value))} /></label>
          <label className="text-xs">Max bet<input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.maxBet} onChange={(e) => updateGame("maxBet", Number(e.target.value))} /></label>
          <label className="text-xs">Max win<input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.maxWin} onChange={(e) => updateGame("maxWin", Number(e.target.value))} /></label>
          <label className="text-xs">Max mult<input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.maxMultiplier} onChange={(e) => updateGame("maxMultiplier", Number(e.target.value))} /></label>
          <label className="text-xs">House edge<input type="number" step="0.01" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.houseEdge} onChange={(e) => updateGame("houseEdge", Number(e.target.value))} /></label>
          <label className="text-xs">Big prize chance<input type="number" step="0.001" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.bigPrizeChance} onChange={(e) => updateGame("bigPrizeChance", Number(e.target.value))} /></label>
          <label className="text-xs">Big prize mult<input type="number" className="mt-1 w-full rounded-lg bg-black/40 border border-emerald-800 px-2 py-1" value={g.bigPrizeMult} onChange={(e) => updateGame("bigPrizeMult", Number(e.target.value))} /></label>
          <label className="flex items-center gap-2 text-xs mt-5">
            <input type="checkbox" checked={g.enabled} onChange={(e) => updateGame("enabled", e.target.checked)} /> Enabled
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <h2 className="font-bold text-gold-300">Launch popup</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={popupEnabled} onChange={(e) => setPopupEnabled(e.target.checked)} /> Enabled
        </label>
        <Input value={popupImage} onChange={(e) => setPopupImage(e.target.value)} placeholder="Image URL" />
        <Input value={popupHref} onChange={(e) => setPopupHref(e.target.value)} placeholder="Link href" />
        <Input value={popupTitleEn} onChange={(e) => setPopupTitleEn(e.target.value)} placeholder="Title EN" />
        <Input value={popupTitleBn} onChange={(e) => setPopupTitleBn(e.target.value)} placeholder="Title BN" />
        <Input value={popupBodyEn} onChange={(e) => setPopupBodyEn(e.target.value)} placeholder="Body EN" />
        <Input value={popupBodyBn} onChange={(e) => setPopupBodyBn(e.target.value)} placeholder="Body BN" />
      </div>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <h2 className="font-bold text-gold-300">Banners JSON (prefer /admin/banners UI)</h2>
        <textarea
          className="h-40 w-full rounded-xl border border-emerald-800 bg-black/40 p-3 font-mono text-xs"
          value={bannersJson}
          onChange={(e) => setBannersJson(e.target.value)}
        />
        <p className="text-[10px] text-emerald-200/50">Array of {"{id,image,href,titleEn,titleBn}"}</p>
      </div>

      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <h2 className="font-bold text-gold-300">Payments & referral</h2>
        <Input value={payBkash} onChange={(e) => setPayBkash(e.target.value)} placeholder="bKash number" />
        <Input value={payNagad} onChange={(e) => setPayNagad(e.target.value)} placeholder="Nagad number" />
        <label className="block text-sm text-emerald-200/70">Referral bonus TK (after first approved deposit)</label>
        <Input type="number" value={refBonus} onChange={(e) => setRefBonus(Number(e.target.value) || 0)} />
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
          Publish announcement
        </Button>
      </div>

      <Button size="lg" className="w-full" onClick={() => save()}>Save all settings</Button>
      {msg && <p className="text-gold-300 text-sm">{msg}</p>}
      <p className="text-xs text-emerald-200/40 leading-relaxed">
        Currency is TK (virtual). Deposit bonus is set by admin on approval. No signup bonus.
      </p>
    </div>
  );
}
