"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";

/** Mystical Forest Adventure — static Pixi slot with TAKA69 wallet bridge */
export default function MysticalForestPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source !== "mystical-forest") return;
      if (d.type === "BALANCE" && typeof d.balance === "number") setBalance(d.balance);
      if (d.type === "NEED_LOGIN") window.location.href = "/login?next=/games/mystical-forest";
      if (d.type === "READY") setLoading(false);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [setBalance]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || user?.balance == null) return;
    win.postMessage(
      { source: "taka69", type: "SET_BALANCE", balance: user.balance, currency: "BDT" },
      "*"
    );
  }, [user?.balance, loading]);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Link
        href="/games"
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      {user && (
        <div className="fixed right-3 top-3 z-[60] rounded-full border border-emerald-400/30 bg-black/60 px-3 py-1.5 text-xs font-black text-emerald-300 backdrop-blur">
          ৳{formatCoins(user.balance)}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-emerald-950 to-black">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
          <div className="text-sm font-bold text-emerald-200">Loading Mystical Forest…</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Mystical Forest"
        src="/assets/games/mystical-forest/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        onLoad={() => window.setTimeout(() => setLoading(false), 900)}
      />
    </div>
  );
}
