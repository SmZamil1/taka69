"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useBrand } from "@/hooks/useBrand";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Bottom sheet permission prompt (BK33-style). */
export function NotificationPrompt() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (localStorage.getItem("taka69_push_prompt") === "1") return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    const timer = window.setTimeout(() => setOpen(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  async function agree() {
    if (busy) return;
    setBusy(true);
    try {
      localStorage.setItem("taka69_push_prompt", "1");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setOpen(false);
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push/subscribe", { credentials: "include" });
      const keyJson = await keyRes.json();
      const publicKey = keyJson?.data?.publicKey as string | undefined;
      if (!publicKey) {
        setOpen(false);
        setBusy(false);
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      if (user) {
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          }),
        }).catch(() => null);
      }

      try {
        await reg.showNotification(brand.siteName || "TAKA69", {
          body: t(
            "Notifications enabled. Bonuses & wins will alert you instantly.",
            "নোটিফিকেশন চালু হয়েছে। বোনাস ও জিতের অ্যালার্ট পাবেন।"
          ),
          icon: brand.logoUrl || "/icons/icon-192.png",
          tag: "push-enabled",
        } as NotificationOptions);
      } catch {
        /* */
      }
    } catch {
      /* */
    }
    setOpen(false);
    setBusy(false);
  }

  function cancel() {
    localStorage.setItem("taka69_push_prompt", "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[240] px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto mb-2 max-w-lg overflow-hidden rounded-[22px] border border-emerald-500/20 bg-[#0a3a2c] shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3 p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-amber-400/60 shadow-lg shadow-black/30">
            <Image
              src={brand.logoUrl || "/icons/logo.png"}
              alt={brand.siteName || "TAKA69"}
              fill
              className="object-cover"
            />
          </div>
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white">
            {t(
              "Turn on notifications to claim your exclusive bonus instantly.",
              "এক্সক্লুসিভ বোনাস পেতে নোটিফিকেশন চালু করুন।"
            )}
          </p>
        </div>
        <div className="flex items-center justify-end gap-5 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={cancel}
            className="text-[15px] font-semibold text-white/75 hover:text-white"
          >
            {t("Cancel", "বাতিল")}
          </button>
          <button
            type="button"
            onClick={agree}
            disabled={busy}
            className="min-w-[96px] rounded-xl bg-[#f5c400] px-6 py-2.5 text-[15px] font-black text-[#143] shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-60"
          >
            {busy ? "…" : t("Agree", "সম্মত")}
          </button>
        </div>
      </div>
    </div>
  );
}
