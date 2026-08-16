"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LayoutGrid,
  Percent,
  Save,
  Search,
  Sliders,
  Sparkles,
  Target,
  Trophy,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_CRASH_CONTROL,
  DEFAULT_GAME_CONFIG,
  type CrashControlProfile,
  type GameCode,
  type GameLimits,
} from "@/lib/game-config";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  aviator: "Aviator",
  crash: "Aviator Crash",
  baccarat: "Baccarat",
  coinflip: "Coin Flip",
  keno: "Keno",
  wingo: "WinGo",
  dice: "Dice",
  mines: "Mines",
  wheel: "Fortune Wheel",
  slots: "Neon Slots",
  plinko: "Plinko",
  hilo: "Hi-Lo",
  jili: "Jili Lobby",
  pg: "PG Soft Lobby",
  spribe: "Spribe Lobby",
  evolution: "Evolution Lobby",
  fa_chai: "Fa Chai Lobby",
  jdb: "JDB Lobby",
  fortune_maya: "Fortune Maya",
  extreme_plinko: "Extreme Plinko",
  mystical_forest: "Mystical Forest",
  cherry_charm: "Cherry Charm",
  pixi_slots: "Neon Reels",
};

const KNOWN_CODES = Object.keys(DEFAULT_GAME_CONFIG) as GameCode[];

type ExtendedLimits = GameLimits & {
  winChancePct: number;
  crashControl: CrashControlProfile;
};

function labelOf(code: string) {
  return LABELS[code] || code.replace(/_/g, " ");
}

function emojiOf(code: string) {
  const lab = labelOf(code);
  const first = lab.split(" ")[0] || "G";
  // if first token isn't emoji-ish, fallback
  return /[A-Za-z0-9]/.test(first) ? first.slice(0,2).toUpperCase() : "G";
}

function titleOf(code: string) {
  const lab = labelOf(code);
  const parts = lab.split(" ");
  if (parts.length <= 1) return lab;
  return parts.slice(1).join(" ") || lab;
}

function toExtended(
  v: Partial<GameLimits> & { winChancePct?: number },
  code?: string
): ExtendedLimits {
  const isCrash = code === "crash" || code === "aviator";
  const defaultHouseEdge = code === "aviator" ? DEFAULT_GAME_CONFIG.aviator.houseEdge : DEFAULT_GAME_CONFIG.crash.houseEdge;
  const houseEdge = isCrash
    ? defaultHouseEdge
    : Math.min(0.99, Math.max(0, Number(v.houseEdge ?? 0.05)));
  const pct = isCrash
    ? Math.round((1 - houseEdge) * 100)
    : typeof v.winChancePct === "number" && Number.isFinite(v.winChancePct)
      ? Math.min(99, Math.max(1, Number(v.winChancePct)))
      : Math.round((1 - houseEdge) * 100);
  const rawCrash = v.crashControl && typeof v.crashControl === "object" ? v.crashControl : DEFAULT_CRASH_CONTROL;
  const crashControl: CrashControlProfile = {
    roundEnabled: rawCrash.roundEnabled !== false,
  };
  return {
    enabled: v.enabled !== false,
    minBet: Math.max(1, Number(v.minBet ?? 10)),
    maxBet: Math.max(1, Number(v.maxBet ?? 5000)),
    maxWin: Math.max(1, Number(v.maxWin ?? 50000)),
    maxMultiplier: Math.max(1.01, Number(v.maxMultiplier ?? 100)),
    houseEdge: isCrash ? houseEdge : Math.round((1 - pct / 100) * 10000) / 10000,
    rtpTarget: isCrash ? 1 - houseEdge : pct / 100,
    ...(isCrash ? {} : { winChancePct: pct }),
    bigPrizeChance: isCrash ? 0 : Math.min(1, Math.max(0, Number(v.bigPrizeChance ?? 0.002))),
    bigPrizeMult: isCrash ? 1 : Math.max(1, Number(v.bigPrizeMult ?? 10)),
    crashControl,
  };
}

function buildInitial(): Record<string, ExtendedLimits> {
  const out: Record<string, ExtendedLimits> = {};
  for (const [k, v] of Object.entries(DEFAULT_GAME_CONFIG)) {
    out[k] = toExtended(v, k);
  }
  return out;
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  color = "emerald",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: "emerald" | "amber" | "rose";
  onChange: (v: number) => void;
}) {
  const safeMax = max === min ? min + 1 : max;
  const pct = Math.max(0, Math.min(100, ((value - min) / (safeMax - min)) * 100));
  const bar =
    color === "rose" ? "#f43f5e" : color === "amber" ? "#f59e0b" : "#10b981";
  return (
    <label className="block">
      <div className="mb-1 flex justify-between gap-2">
        <span className="text-xs text-white/60">{label}</span>
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            color === "rose" ? "text-rose-400" : color === "amber" ? "text-amber-400" : "text-emerald-400"
          )}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
        style={{ backgroundImage: `linear-gradient(to right, ${bar} ${pct}%, transparent ${pct}%)` }}
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-white/25">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs text-white/60">
      {label}
      <input
        type="number"
        step={step}
        min={min}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-400/40"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-amber-300">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-black text-white">{title}</div>
          {hint ? <div className="text-[11px] text-white/40">{hint}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdminGamesPage() {
  const [gameConfig, setGameConfig] = useState<Record<string, ExtendedLimits>>(buildInitial);
  const [selected, setSelected] = useState<string>("crash");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const codes = useMemo(() => {
    const keys = Object.keys(gameConfig);
    // known first (stable order), then any extras
    const known = KNOWN_CODES.filter((c) => keys.includes(c));
    const extra = keys.filter((c) => !KNOWN_CODES.includes(c as GameCode)).sort();
    return [...known, ...extra];
  }, [gameConfig]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return codes;
    return codes.filter((c) => {
      const lab = labelOf(c).toLowerCase();
      return c.toLowerCase().includes(s) || lab.includes(s);
    });
  }, [codes, q]);

  const g = gameConfig[selected] || toExtended(DEFAULT_GAME_CONFIG.crash, selected);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", { credentials: "include", cache: "no-store" });
      const j = await res.json();
      if (!j.ok) {
        setMsg(j.error || "Failed to load config");
        setMsgType("err");
        return;
      }
      const raw = (j.data?.config?.gameConfig || {}) as Record<string, Partial<GameLimits>>;
      setGameConfig((prev) => {
        const next = { ...prev };
        // ensure defaults exist
        for (const code of KNOWN_CODES) {
          if (!next[code]) next[code] = toExtended(DEFAULT_GAME_CONFIG[code], code);
        }
        for (const [k, v] of Object.entries(raw)) {
          if (!v || typeof v !== "object") continue;
          const base = next[k] || toExtended(DEFAULT_GAME_CONFIG[k as GameCode] || DEFAULT_GAME_CONFIG.crash, k);
          next[k] = toExtended({ ...base, ...v }, k);
        }
        return next;
      });
      // keep selection valid
      setSelected((cur) => {
        if (cur && (raw[cur] || DEFAULT_GAME_CONFIG[cur as GameCode])) return cur;
        return "crash";
      });
    } catch {
      setMsg("Network error loading games");
      setMsgType("err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function update(field: keyof ExtendedLimits, value: number | boolean) {
    setGameConfig((prev) => {
      const cur = prev[selected] || toExtended(DEFAULT_GAME_CONFIG.crash, selected);
      const updated: ExtendedLimits = { ...cur, [field]: value } as ExtendedLimits;
      if (field === "winChancePct") {
        const pct = Math.min(99, Math.max(1, Number(value)));
        updated.winChancePct = pct;
        updated.houseEdge = Math.round((1 - pct / 100) * 10000) / 10000;
        updated.rtpTarget = pct / 100;
      } else if (field === "houseEdge") {
        const edge = Math.min(0.99, Math.max(0, Number(value)));
        updated.houseEdge = edge;
        updated.winChancePct = Math.round((1 - edge) * 100);
        updated.rtpTarget = 1 - edge;
      }
      return { ...prev, [selected]: updated };
    });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const toSave: Record<string, ExtendedLimits> = {};
      for (const [k, v] of Object.entries(gameConfig)) {
        if (!v) continue;
        const normalized = toExtended(v, k);
        if (k === "crash" || k === "aviator") {
          normalized.houseEdge = DEFAULT_GAME_CONFIG[k].houseEdge;
          normalized.rtpTarget = DEFAULT_GAME_CONFIG[k].rtpTarget;
          delete (normalized as Partial<ExtendedLimits>).winChancePct;
          delete (normalized as Partial<ExtendedLimits>).bigPrizeChance;
          delete (normalized as Partial<ExtendedLimits>).bigPrizeMult;
        }
        toSave[k] = normalized;
      }

      // mirror enabled into catalog
      let catalogPatch: Record<string, unknown> = {};
      try {
        const cur = await fetch("/api/admin/config", { credentials: "include", cache: "no-store" }).then((r) =>
          r.json()
        );
        const existing = (cur?.ok && cur.data?.config?.gamesCatalog) || {};
        catalogPatch = { ...(existing as object) };
        for (const [k, v] of Object.entries(toSave)) {
          const prev = (catalogPatch[k] as Record<string, unknown>) || {};
          catalogPatch[k] = { ...prev, enabled: v.enabled !== false };
        }
      } catch {
        catalogPatch = Object.fromEntries(
          Object.entries(toSave).map(([k, v]) => [k, { enabled: v.enabled !== false }])
        );
      }

      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameConfig: toSave, gamesCatalog: catalogPatch }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Save failed");
        setMsgType("err");
        return;
      }
      await load();
      setMsg("✅ Saved — disabled games hide on Home & /games");
      setMsgType("ok");
    } catch {
      setMsg("Network error");
      setMsgType("err");
    } finally {
      setSaving(false);
    }
  }

  const showAviatorLive = selected === "aviator" || selected === "crash";

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#050a08]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/admin" className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/70">
                Admin · Games
              </div>
              <h1 className="truncate text-xl font-black text-white">Game Control Center</h1>
              <p className="text-xs text-white/45">
                Enable/disable, win chance, limits — one place for every game.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => void load()} disabled={loading || saving}>
              Refresh
            </Button>
            <Button onClick={() => void save()} disabled={saving || loading} className="gap-2 px-5 shadow-lg shadow-emerald-500/20">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save all"}
            </Button>
          </div>
        </div>
      </div>

      {msg ? (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-semibold",
            msgType === "ok" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
          )}
        >
          {msg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-[12px] text-white/65">
        <div className="flex items-start gap-2">
          <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <b className="text-white/85">How to use:</b> pick a game → toggle{" "}
            <span className="text-emerald-300">Enabled</span> (shown) /{" "}
            <span className="text-rose-300">Disabled</span> (hidden) → set win % & limits →{" "}
            <b className="text-white/85">Save all</b>.
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left: game list */}
        <aside className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search games…"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/40"
            />
          </div>

          <div className="max-h-[70vh] space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
            {loading ? (
              <div className="p-6 text-center text-sm text-white/40">Loading games…</div>
            ) : filtered.length ? (
              filtered.map((code) => {
                const item = gameConfig[code] || toExtended(DEFAULT_GAME_CONFIG.crash, code);
                const on = item.enabled !== false;
                const active = selected === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelected(code)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                      active
                        ? "border-emerald-400/40 bg-emerald-500/15"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                    )}
                  >
                    <span className="text-base">{emojiOf(code)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{titleOf(code)}</span>
                      <span className="block truncate font-mono text-[10px] text-white/35">{code}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black",
                        on ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                      )}
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-white/40">No games match</div>
            )}
          </div>
        </aside>

        {/* Right: editor */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-amber-400/15 bg-gradient-to-b from-amber-400/[0.07] via-white/[0.03] to-transparent p-5 shadow-[0_0_40px_rgba(251,191,36,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  <Sparkles className="h-3 w-3" /> Live controls
                </div>
                <h2 className="text-xl font-black text-white">
                  {emojiOf(selected)} {titleOf(selected)}
                </h2>
                <p className="text-[11px] text-white/40">
                  code <span className="font-mono text-white/60">{selected}</span>
                  {" · "}
                  {g.enabled ? "visible on website" : "hidden from website"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => update("enabled", !g.enabled)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-lg transition",
                  g.enabled
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-emerald-500/10"
                    : "border-rose-400/40 bg-rose-500/15 text-rose-200 shadow-rose-500/10"
                )}
              >
                {g.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {g.enabled ? "Enabled · shown" : "Disabled · hidden"}
              </button>
            </div>
          </div>

          {showAviatorLive ? (
            <Section
              icon={<Percent className="h-4 w-4" />}
              title="Fair generation"
              hint="Crash and Aviator outcomes are generated from the server seed and public RTP profile."
            >
              <div className="grid grid-cols-2 gap-3 text-[11px] text-white/55">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  Public house edge{" "}
                  <b className="text-white/80">{(Number(g.houseEdge || 0) * 100).toFixed(1)}%</b>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  Public RTP{" "}
                  <b className="text-white/80">{(Number(g.rtpTarget || 0) * 100).toFixed(1)}%</b>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                Outcome buckets, minimum/maximum crash points, and win-chance controls are not available.
                Pause and betting/payout limits remain configurable.
              </p>
            </Section>
          ) : (
            <Section
              icon={<Percent className="h-4 w-4" />}
              title="Win chance"
              hint="Higher % = players win more often. Applies on next bet."
            >
              <SliderField
                label="Player win chance"
                value={Number(g.winChancePct ?? 50)}
                min={1}
                max={99}
                step={1}
                unit="%"
                color="amber"
                onChange={(v) => update("winChancePct", v)}
              />
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-white/45">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  House edge{" "}
                  <b className="text-white/80">{(Number(g.houseEdge || 0) * 100).toFixed(1)}%</b>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  RTP target{" "}
                  <b className="text-white/80">{(Number(g.rtpTarget || 0) * 100).toFixed(1)}%</b>
                </div>
              </div>
            </Section>
          )}

          <Section icon={<Sliders className="h-4 w-4" />} title="Betting limits" hint="Min/max stake and payout caps.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumberField label="Min bet (TK)" value={g.minBet} min={1} onChange={(v) => update("minBet", v)} />
              <NumberField label="Max bet (TK)" value={g.maxBet} min={1} onChange={(v) => update("maxBet", v)} />
              <NumberField label="Max win (TK)" value={g.maxWin} min={1} onChange={(v) => update("maxWin", v)} />
              <NumberField
                label="Max multiplier (x)"
                value={g.maxMultiplier}
                min={1}
                step={0.1}
                onChange={(v) => update("maxMultiplier", v)}
              />
            </div>
          </Section>

          {!showAviatorLive ? (
          <Section icon={<Trophy className="h-4 w-4" />} title="Big prize boost" hint="Rare jackpot-style bump on eligible wins.">
            <div className="grid gap-3 md:grid-cols-2">
              <SliderField
                label="Big prize chance"
                value={Math.round(Number(g.bigPrizeChance || 0) * 1000) / 10}
                min={0}
                max={10}
                step={0.1}
                unit="%"
                color="rose"
                onChange={(v) => update("bigPrizeChance", v / 100)}
              />
              <NumberField
                label="Big prize multiplier"
                value={g.bigPrizeMult}
                min={1}
                step={0.1}
                onChange={(v) => update("bigPrizeMult", v)}
              />
            </div>
          </Section>
          ) : null}

          {showAviatorLive ? (
            <Section
              icon={<Target className="h-4 w-4" />}
              title="Crash / Aviator lifecycle"
              hint="Pause is available; outcomes always use the default provably-fair distribution."
            >
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <div className="text-xs font-bold text-white">Rounds enabled</div>
                  <div className="text-[10px] text-white/40">Pause creates no new betting round after the current round finishes.</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setGameConfig((prev) => ({
                      ...prev,
                      [selected]: {
                        ...(prev[selected] || g),
                        crashControl: { ...g.crashControl, roundEnabled: !g.crashControl.roundEnabled },
                      },
                    }))
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-black",
                    g.crashControl.roundEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  )}
                >
                  {g.crashControl.roundEnabled ? "ON" : "PAUSED"}
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                Admin outcome buckets and crash-point min/max controls are ignored. The server commits a hash before each round and reveals the seed after the crash.
              </p>
            </Section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save()} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save all games"}
            </Button>
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => {
                const def = DEFAULT_GAME_CONFIG[selected as GameCode] || DEFAULT_GAME_CONFIG.crash;
                setGameConfig((prev) => ({ ...prev, [selected]: toExtended(def, selected) }));
                setMsg("Reset current game to defaults (not saved yet)");
                setMsgType("ok");
              }}
            >
              Reset this game
            </Button>
            <Button
              variant="danger"
              disabled={saving || !selected}
              className="gap-2"
              onClick={async () => {
                if (!selected) return;
                if (!confirm(`Move "${titleOf(selected)}" to trash for 30 days? It will disappear from the website.`)) return;
                setSaving(true);
                try {
                  const res = await fetch("/api/admin/config", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ trashGame: { code: selected, name: titleOf(selected) } }),
                  });
                  const j = await res.json();
                  if (j.ok) {
                    setMsg("Moved to trash (30 days). Restore anytime from Trash box.");
                    setMsgType("ok");
                    await load();
                  } else {
                    setMsg(j.error || "Trash failed");
                    setMsgType("err");
                  }
                } catch {
                  setMsg("Network error");
                  setMsgType("err");
                }
                setSaving(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Trash game
            </Button>
          </div>
        </div>
      </div>

      <TrashBox onChanged={() => void load()} />

      {/* Catalog editor kept simple & safe */}
      <CatalogEditor />
    </div>
  );
}

type CatalogRow = {
  code: string;
  nameEn: string;
  nameBn: string;
  cover: string;
  sortOrder: number;
  enabled: boolean;
  category: string;
  custom?: boolean;
  href?: string;
};


function TrashBox({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<{ code: string; name?: string; trashedAt?: string; purgeAt?: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/config", { credentials: "include", cache: "no-store" });
      const j = await res.json();
      if (!j.ok) return;
      const brand = (j.data?.config?.brandConfig || {}) as { trashedGames?: unknown };
      const raw = Array.isArray(brand.trashedGames) ? brand.trashedGames : [];
      const now = Date.now();
      setItems(
        raw
          .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
          .filter((x): x is Record<string, unknown> => !!x && typeof x.code === "string")
          .filter((x) => {
            const purgeAt = x.purgeAt ? new Date(String(x.purgeAt)).getTime() : 0;
            return !purgeAt || purgeAt > now;
          })
          .map((x) => ({
            code: String(x.code),
            name: x.name ? String(x.name) : String(x.code),
            trashedAt: x.trashedAt ? String(x.trashedAt) : undefined,
            purgeAt: x.purgeAt ? String(x.purgeAt) : undefined,
          }))
      );
    } catch {
      /* */
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function restore(code: string) {
    setBusy(code);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restoreGame: { code } }),
      });
      const j = await res.json();
      if (j.ok) {
        await refresh();
        onChanged();
      }
    } catch {
      /* */
    }
    setBusy(null);
  }

  return (
    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
          <Trash2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-lg font-black text-white">Trash box</div>
          <p className="text-xs text-white/40">
            Trashed games stay hidden for 30 days. Restore anytime before auto-purge.
          </p>
        </div>
      </div>
      {!items.length ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/40">
          Trash is empty
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const daysLeft = it.purgeAt
              ? Math.max(0, Math.ceil((new Date(it.purgeAt).getTime() - Date.now()) / 86400000))
              : 30;
            return (
              <div
                key={it.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{it.name || it.code}</div>
                  <div className="font-mono text-[10px] text-white/35">
                    {it.code} · {daysLeft}d left
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="gap-1.5"
                  disabled={busy === it.code}
                  onClick={() => void restore(it.code)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function CatalogEditor() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/config", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
      import("@/lib/games-meta").then((m) => m.GAMES),
    ])
      .then(([j, games]) => {
        const catalog = (j?.ok && j.data?.config?.gamesCatalog) || {};
        const next: CatalogRow[] = games.map((g, i) => {
          const o = (catalog as Record<string, Record<string, unknown>>)[g.code] || {};
          return {
            code: g.code,
            nameEn: String(o.nameEn || g.en),
            nameBn: String(o.nameBn || g.bn),
            cover: String(o.cover || g.cover),
            sortOrder: typeof o.sortOrder === "number" ? Number(o.sortOrder) : i + 1,
            enabled: o.enabled !== false,
            category: String(o.category || g.category || "hot"),
            custom: false,
            href: g.href,
          };
        });
        for (const [code, o] of Object.entries(catalog as Record<string, Record<string, unknown>>)) {
          if (next.some((r) => r.code === code)) continue;
          next.push({
            code,
            nameEn: String(o.nameEn || code),
            nameBn: String(o.nameBn || o.nameEn || code),
            cover: String(o.cover || "/banners/welcome.jpg"),
            sortOrder: typeof o.sortOrder === "number" ? Number(o.sortOrder) : 900,
            enabled: o.enabled !== false,
            category: String(o.category || "hot"),
            custom: true,
            href: String(o.href || `/games/coming/${code}`),
          });
        }
        setRows(next.sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const gamesCatalog = Object.fromEntries(
        rows.map((r) => [
          r.code,
          {
            nameEn: r.nameEn,
            nameBn: r.nameBn,
            cover: r.cover,
            sortOrder: r.sortOrder,
            enabled: r.enabled,
            category: r.category,
            custom: !!r.custom,
            href: r.href || (r.custom ? `/games/coming/${r.code}` : undefined),
          },
        ])
      );
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gamesCatalog }),
      });
      const json = await res.json();
      setMsg(json.ok ? "✅ Catalog saved (covers, order, visibility)" : json.error || "Failed");
    } catch {
      setMsg("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-lg font-black text-white">Lobby catalog</div>
          <p className="text-xs text-white/40">Covers, sort order, names — easy lobby layout control.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              const code = `custom_${Date.now().toString(36)}`;
              setRows((all) => [
                ...all,
                {
                  code,
                  nameEn: "New Game",
                  nameBn: "গেম",
                  cover: "/banners/welcome.jpg",
                  sortOrder: (all[all.length - 1]?.sortOrder || 100) + 1,
                  enabled: true,
                  category: "hot",
                  custom: true,
                  href: `/games/coming/${code}`,
                },
              ]);
            }}
          >
            + Add game
          </Button>
          <Button onClick={() => void save()} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save catalog"}
          </Button>
        </div>
      </div>

      {msg ? <div className="mb-3 text-sm text-emerald-300">{msg}</div> : null}

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.code}
            className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2.5"
          >
            <div className="col-span-12 sm:col-span-3">
              <div className="truncate text-sm font-bold text-white">{r.nameEn}</div>
              <div className="truncate font-mono text-[10px] text-white/35">{r.code}</div>
            </div>
            <input
              className="col-span-6 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white sm:col-span-3"
              value={r.nameEn}
              onChange={(e) => setRows((all) => all.map((x) => (x.code === r.code ? { ...x, nameEn: e.target.value } : x)))}
              placeholder="Name EN"
            />
            <input
              className="col-span-6 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white sm:col-span-2"
              type="number"
              value={r.sortOrder}
              onChange={(e) =>
                setRows((all) =>
                  all.map((x) => (x.code === r.code ? { ...x, sortOrder: Number(e.target.value) || 0 } : x))
                )
              }
              placeholder="Order"
            />
            <input
              className="col-span-9 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white sm:col-span-3"
              value={r.cover}
              onChange={(e) => setRows((all) => all.map((x) => (x.code === r.code ? { ...x, cover: e.target.value } : x)))}
              placeholder="Cover URL"
            />
            <button
              type="button"
              onClick={() => setRows((all) => all.map((x) => (x.code === r.code ? { ...x, enabled: !x.enabled } : x)))}
              className={cn(
                "col-span-3 rounded-lg px-2 py-1.5 text-xs font-bold sm:col-span-1",
                r.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              )}
            >
              {r.enabled ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
