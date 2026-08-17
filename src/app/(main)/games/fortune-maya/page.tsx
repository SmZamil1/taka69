"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";

/**
 * Fortune Maya — full-screen immersive iframe with loader + live wallet bridge (BDT).
 */
export default function FortuneMayaPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const setBalance = useAuthStore((s) => s.setBalance);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.source !== "fortune-maya") return;

      if (data.type === "BALANCE" && typeof data.balance === "number") {
        setBalance(data.balance);
      }
      if (data.type === "NEED_LOGIN") {
        window.location.href = "/login?next=/games/fortune-maya";
      }
      if (data.type === "READY") {
        setLoading(false);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [setBalance]);

  // push balance into iframe when auth store updates
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || user?.balance == null) return;
    win.postMessage(
      { source: "taka69", type: "SET_BALANCE", balance: user.balance, currency: "BDT" },
      "*"
    );
  }, [user?.balance, loading]);

  // safety: hide loader after timeout even if game doesn't ping READY
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 12000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1a0a00] via-black to-black">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-amber-400/10" />
          </div>
          <div className="text-center">
            <div className="text-lg font-black tracking-wide text-amber-300">Fortune Maya</div>
            <div className="mt-1 text-xs text-white/45">Loading game assets…</div>
          </div>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" />
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
          <div className="text-lg font-bold text-white">Could not load Fortune Maya</div>
          <button
            type="button"
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black"
            onClick={() => {
              setLoadError(false);
              setLoading(true);
              if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
            }}
          >
            Retry
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        title="Fortune Maya"
        src="/assets/games/fortune-maya/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        onLoad={() => {
          // give Phaser a moment to boot, then fade loader
          window.setTimeout(() => setLoading(false), 900);
        }}
        onError={() => {
          setLoadError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
