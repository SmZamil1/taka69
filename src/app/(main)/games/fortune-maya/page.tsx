"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/hooks/useAuth";

/**
 * Fortune Maya — full-screen immersive iframe with live wallet bridge (BDT).
 */
export default function FortuneMayaPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const setBalance = useAuthStore((s) => s.setBalance);
  const user = useAuthStore((s) => s.user);

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
  }, [user?.balance]);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <iframe
        ref={iframeRef}
        title="Fortune Maya"
        src="/assets/games/fortune-maya/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
