"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

/** Full Cherry Charm 3D slot (built from michaelkolesidis/cherry-charm) + TAKA69 wallet */
export default function CherryCharmPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const setBalance = useAuthStore((s) => s.setBalance);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data;
      if (!d || d.source !== "cherry-charm") return;
      if (d.type === "READY") {
        setLoading(false);
        pushBalance();
      }
      if (d.type === "BALANCE" && typeof d.balance === "number") {
        setBalance(d.balance);
      }
      if (d.type === "NEED_LOGIN") {
        window.location.href = "/login?next=/games/cherry-charm";
      }
      if (d.type === "ERROR" && d.error) {
        setErr(String(d.error));
        window.setTimeout(() => setErr(null), 3200);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBalance]);

  function pushBalance() {
    const win = iframeRef.current?.contentWindow;
    if (!win || user?.balance == null) return;
    win.postMessage(
      { source: "taka69", type: "SET_BALANCE", balance: user.balance, currency: "BDT" },
      "*"
    );
  }

  useEffect(() => {
    if (!loading) pushBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.balance, loading]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-rose-950 to-black p-6 text-center">
        <img
          src="/assets/games/cherry-charm/images/logo.png"
          alt="Cherry Charm"
          className="h-20 w-auto object-contain"
        />
        <p className="text-sm text-white/70">Login to play Cherry Charm with your wallet</p>
        <Link href="/login?next=/games/cherry-charm">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-black">
      {err && (
        <div className="fixed left-1/2 top-16 z-[70] max-w-[90%] -translate-x-1/2 rounded-xl border border-rose-400/40 bg-rose-950/90 px-3 py-2 text-center text-xs font-semibold text-rose-100">
          {err}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-rose-950 to-black">
          <img
            src="/assets/games/cherry-charm/images/logo.png"
            alt=""
            className="h-16 w-auto animate-pulse object-contain"
          />
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-400/20 border-t-rose-400" />
          <div className="text-sm font-bold text-rose-100">Loading Cherry Charm…</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Cherry Charm"
        src="/assets/games/cherry-charm/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        onLoad={() => window.setTimeout(() => setLoading(false), 1200)}
      />
    </div>
  );
}
