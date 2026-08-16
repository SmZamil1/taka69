"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gift,
  Heart,
  Home,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins, cn } from "@/lib/utils";
import "@/app/aviator.css";

/**
 * Full Unity WebGL host for aviator-crash-master assets.
 * Provides react-unity-webgl-compatible window.dispatchReactUnityEvent bridge
 * + collapsible top chrome matching the product reference.
 */
export default function AviatorUnityPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const unityRef = useRef<any>(null);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [topOpen, setTopOpen] = useState(false);
  const [favOn, setFavOn] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [ready, setReady] = useState(false);

  const build = useMemo(
    () => ({
      loader: "/assets/games/aviator_crash_master/unity/AirCrash.loader.js",
      data: "/assets/games/aviator_crash_master/unity/AirCrash.data.unityweb",
      framework: "/assets/games/aviator_crash_master/unity/AirCrash.framework.js.unityweb",
      code: "/assets/games/aviator_crash_master/unity/AirCrash.wasm.unityweb",
    }),
    []
  );

  const installBridge = useCallback(() => {
    const w = window as any;
    // Critical: Unity C# calls this
    w.dispatchReactUnityEvent = function (eventName: string, payload?: unknown) {
      try {
        window.dispatchEvent(
          new CustomEvent("aviator-unity-event", {
            detail: { eventName: String(eventName || ""), payload },
          })
        );
      } catch {
        /* */
      }
      return true;
    };
    // silence alert spam from unity exception handler
    if (!w.__taka69_alert_patched) {
      const _alert = w.alert?.bind(w);
      w.alert = (msg: unknown) => {
        const s = String(msg || "");
        console.warn("[unity-alert]", s);
        if (/dispatchReactUnityEvent|Unity content|TypeError|RuntimeError/i.test(s)) {
          setErr(s.slice(0, 280));
          setLoading(false);
          return;
        }
        // swallow other unity alerts
      };
      w.__taka69_alert_patched = true;
      w.__taka69_alert_orig = _alert;
    }
  }, []);

  const bootUnity = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setProgress(0);
    installBridge();
    try {
      // load loader script once
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[data-unity-loader="aircrash"]`);
        if (existing) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = build.loader;
        s.async = true;
        s.dataset.unityLoader = "aircrash";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Unity loader"));
        document.body.appendChild(s);
      });

      const createUnityInstance = (window as any).createUnityInstance;
      if (typeof createUnityInstance !== "function") {
        throw new Error("createUnityInstance missing");
      }
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas missing");

      const instance = await createUnityInstance(
        canvas,
        {
          dataUrl: build.data,
          frameworkUrl: build.framework,
          codeUrl: build.code,
          streamingAssetsUrl: "StreamingAssets",
          companyName: "TAKA69",
          productName: "Aviator",
          productVersion: "1.0",
          showBanner: () => {},
          // match device pixel ratio for sharp mobile
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        },
        (p: number) => setProgress(Math.round((p || 0) * 100))
      );
      unityRef.current = instance;
      (window as any).unityInstance = instance;
      setReady(true);
      setLoading(false);

      // push balance if game listens later
      try {
        if (user?.balance != null && instance?.SendMessage) {
          // best-effort; object names vary by build
          instance.SendMessage("GameManager", "SetBalance", String(user.balance));
        }
      } catch {
        /* */
      }
    } catch (e) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "Unity failed to start");
      setLoading(false);
    }
  }, [build, installBridge, user?.balance]);

  useEffect(() => {
    void bootUnity();
    try {
      const raw = localStorage.getItem("taka69_fav_games");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setFavOn(arr.includes("aviator_unity"));
    } catch {
      /* */
    }
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      try {
        unityRef.current?.Quit?.();
      } catch {
        /* */
      }
    };
  }, [bootUnity]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-0 flex flex-col bg-black text-white">
      {/* Collapsible top chrome */}
      <div className={cn("av-top-chrome", topOpen && "open")}>
        <div className="av-wallet-strip">
          <div className="av-wallet-pill">
            <span className="av-wallet-dot">৳</span>
            <span className="av-wallet-amt">{user ? formatCoins(user.balance) : "0.00"}</span>
          </div>
          <div className="av-wallet-actions">
            <Link href="/wallet?tab=deposit" className="av-deposit-btn">
              DEPOSIT
            </Link>
            <Link href="/promotions" className="av-gift-btn" aria-label="Promotions">
              <Gift className="h-5 w-5" />
              <span className="av-gift-badge">1</span>
            </Link>
          </div>
        </div>

        <div className="av-tools-row">
          <Link href="/games" className="av-tool">
            <ArrowLeft className="h-5 w-5" />
            <span>back</span>
          </Link>
          <button
            type="button"
            className={cn("av-tool", favOn && "on")}
            onClick={() => {
              setFavOn((v) => {
                const next = !v;
                try {
                  const key = "taka69_fav_games";
                  const raw = localStorage.getItem(key);
                  const arr: string[] = raw ? JSON.parse(raw) : [];
                  const set = new Set(arr);
                  if (next) set.add("aviator_unity");
                  else set.delete("aviator_unity");
                  localStorage.setItem(key, JSON.stringify(Array.from(set)));
                } catch {
                  /* */
                }
                return next;
              });
            }}
          >
            <Heart className={cn("h-5 w-5", favOn && "fill-current")} />
            <span>{favOn ? "Favorited" : "Add Favorite"}</span>
          </button>
          <Link href="/games?fav=1" className="av-tool">
            <Heart className="h-5 w-5" />
            <span>My favorites</span>
          </Link>
          <Link href="/games" className="av-tool">
            <Search className="h-5 w-5" />
            <span>Search</span>
          </Link>
          <Link href="/" className="av-tool">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <button
            type="button"
            className="av-tool"
            onClick={async () => {
              try {
                const el = rootRef.current || document.documentElement;
                if (!document.fullscreenElement) {
                  await el.requestFullscreen?.();
                  setIsFs(true);
                } else {
                  await document.exitFullscreen?.();
                  setIsFs(false);
                }
              } catch {
                /* */
              }
            }}
          >
            {isFs ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            <span>Fullscreen</span>
          </button>
        </div>

        <div className="av-mini-bar">
          <div className="av-logo-text">Aviator</div>
          <button
            type="button"
            className="av-hist-arrow"
            onClick={() => setTopOpen((v) => !v)}
            aria-label={topOpen ? "Hide menu" : "Show menu"}
          >
            {topOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <div className="av-mini-right">
            <div className="av-top-balance">
              <span className="num">{user ? formatCoins(user.balance) : "0.00"}</span>
              <span className="cur">BDT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-black">
        {!topOpen && <ImmersiveBack className="!top-14" />}
        <canvas ref={canvasRef} id="unity-canvas" className="h-full w-full block bg-black" />

        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#1a0800] to-black">
            <div className="h-14 w-14 animate-spin rounded-full border-2 border-orange-400/20 border-t-orange-400" />
            <div className="text-sm font-bold text-orange-200">Loading Aviator Unity…</div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
            <div className="text-[11px] text-white/40">{progress}%</div>
          </div>
        )}

        {err && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/95 px-6 text-center">
            <div className="text-lg font-black text-white">Unity host error</div>
            <p className="max-w-sm break-words text-xs text-white/50">{err}</p>
            <p className="max-w-xs text-[11px] text-white/40">
              Native Aviator has full wallet cashout. Unity shell is visual/host mode.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/games/aviator"
                className="rounded-xl bg-orange-400 px-4 py-2 text-sm font-bold text-black"
              >
                Open native Aviator
              </Link>
              <button
                type="button"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white"
                onClick={() => void bootUnity()}
              >
                Retry Unity
              </button>
            </div>
          </div>
        )}

        {ready && !loading && !err && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] text-white/50">
            Unity host · wallet play on native Aviator
          </div>
        )}
      </div>
    </div>
  );
}
