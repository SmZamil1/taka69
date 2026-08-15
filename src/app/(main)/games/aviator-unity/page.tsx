"use client";

import { useEffect, useRef, useState } from "react";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";

/**
 * Unity WebGL Aviator shell from uploaded aviator-crash-master assets.
 * Bets still settle through our /api/games/crash wallet engine via overlay controls.
 */
export default function AviatorUnityPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 10000);
    return () => window.clearTimeout(t);
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
          <div className="text-[11px] text-white/40">WebGL assets · first load may take a moment</div>
        </div>
      )}

      {err && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
          <div className="text-lg font-black text-white">Unity build unavailable</div>
          <p className="max-w-xs text-xs text-white/50">
            Use the native Aviator for full wallet play, or retry this build.
          </p>
          <div className="flex gap-2">
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
                setErr(false);
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
        src="/assets/games/aviator_crash_master/unity/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={() => window.setTimeout(() => setLoading(false), 800)}
        onError={() => {
          setErr(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
