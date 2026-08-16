"use client";

import { useEffect, useRef, useState } from "react";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";

/**
 * Unity WebGL shell (AirCrash). Includes host bridge stubs for react-unity-webgl events.
 * Full wallet play remains on native /games/aviator.
 */
export default function AviatorUnityPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source !== "aviator-unity") return;
      if (d.type === "READY") setLoading(false);
      if (d.type === "ERROR") {
        setLoading(false);
        setErr(String(d.message || "Unity error"));
      }
      // UNITY_EVENT from wasm bridge — ignore silently (visual-only shell)
    }
    window.addEventListener("message", onMsg);
    const t = window.setTimeout(() => setLoading(false), 14000);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <ImmersiveBack />
      {user && (
        <div className="fixed right-3 top-3 z-[60] rounded-full border border-amber-400/30 bg-black/60 px-3 py-1.5 text-xs font-black text-amber-300 backdrop-blur">
          ৳{formatCoins(user.balance)}
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#1a0800] to-black">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-orange-400/20 border-t-orange-400" />
          <div className="text-sm font-bold text-orange-200">Loading Aviator Unity…</div>
          <div className="text-[11px] text-white/40">WebGL · first load can take a bit</div>
        </div>
      )}

      {err && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/95 px-6 text-center">
          <div className="text-lg font-black text-white">Unity shell error</div>
          <p className="max-w-sm text-xs text-white/50 break-words">{err.slice(0, 240)}</p>
          <p className="max-w-xs text-[11px] text-white/40">
            This Unity package expects a React host. Use native Aviator for bets & cashout.
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
              onClick={() => {
                setErr(null);
                setLoading(true);
                if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        title="Aviator Unity"
        src={`/assets/games/aviator_crash_master/unity/index.html?v=2`}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={() => window.setTimeout(() => setLoading(false), 1200)}
        onError={() => {
          setErr("Failed to load Unity iframe");
          setLoading(false);
        }}
      />
    </div>
  );
}
