"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

/** Mystical Forest Adventure — contained responsive canvas + TAKA69 wallet bridge */
export default function MysticalForestPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function pushBalance() {
    const win = iframeRef.current?.contentWindow;
    if (!win || user?.balance == null) return;
    win.postMessage(
      {
        source: "taka69",
        type: "SET_BALANCE",
        balance: user.balance,
        currency: "BDT",
      },
      "*"
    );
  }

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source !== "mystical-forest") return;
      if (d.type === "READY") {
        setLoading(false);
        pushBalance();
      }
      if (d.type === "BALANCE" && typeof d.balance === "number") {
        setBalance(d.balance);
      }
      if (d.type === "NEED_LOGIN") {
        window.location.href = "/login?next=/games/mystical-forest";
      }
      if (d.type === "ERROR" && d.error) {
        setErr(String(d.error));
        window.setTimeout(() => setErr(null), 3200);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBalance, user?.balance]);

  useEffect(() => {
    if (!loading) pushBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.balance, loading]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-emerald-950 to-black p-6 text-center">
        <p className="text-sm text-white/70">Login to play Mystical Forest</p>
        <Link href="/login?next=/games/mystical-forest">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black [padding-top:env(safe-area-inset-top)] [padding-right:env(safe-area-inset-right)] [padding-bottom:env(safe-area-inset-bottom)] [padding-left:env(safe-area-inset-left)]">
      {err && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[70] max-w-[90vw] -translate-x-1/2 rounded-xl border border-rose-400/40 bg-rose-950/90 px-3 py-2 text-center text-xs font-semibold text-rose-100 shadow-lg">
          {err}
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
        className="absolute inset-0 h-full w-full min-h-0 min-w-0 border-0"
        allow="autoplay; fullscreen"
        onLoad={() => window.setTimeout(() => setLoading(false), 800)}
      />
    </div>
  );
}
