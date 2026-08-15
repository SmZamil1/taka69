"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";

/** Extreme Plinko — immersive iframe with loader + wallet bridge */
export default function Page() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const setBalance = useAuthStore((s) => s.setBalance);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.source !== "extreme-plinko" && data.source !== "plinko") return;
      if (data.type === "BALANCE" && typeof data.balance === "number") {
        setBalance(data.balance);
      }
      if (data.type === "NEED_LOGIN") {
        window.location.href = "/login?next=/games/extreme-plinko";
      }
      if (data.type === "READY") setLoading(false);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [setBalance]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || user?.balance == null || loading) return;
    win.postMessage(
      { source: "taka69", type: "SET_BALANCE", balance: user.balance, currency: "BDT" },
      "*"
    );
  }, [user?.balance, loading]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 14000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#05080a]">
      <ImmersiveBack />
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#05080a]">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-cyan-300">Extreme Plinko</div>
            <div className="mt-1 text-xs text-white/45">Preparing board…</div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
          <div className="text-lg font-bold text-white">Plinko failed to load</div>
          <p className="max-w-xs text-xs text-white/50">
            Check assets under /assets/games/extreme_plinko or try again.
          </p>
          <button
            type="button"
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-black"
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
        title="Extreme Plinko"
        src="/assets/games/extreme_plinko/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        onLoad={() => window.setTimeout(() => setLoading(false), 700)}
        onError={() => {
          setLoadError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
