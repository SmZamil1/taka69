"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationPrompt() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (localStorage.getItem("taka69_push_prompt") === "1") return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    const timer = window.setTimeout(() => setOpen(true), 1800);
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

      // local confirmation toast-like notification
      try {
        await reg.showNotification("TAKA69", {
          body: t(
            "Notifications enabled. Bonuses & wins will alert you instantly.",
            "নোটিফিকেশন চালু হয়েছে। বোনাস ও জিতের অ্যালার্ট পাবেন।"
          ),
          icon: "/icons/icon-192.png",
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
    <div className="fixed inset-x-0 bottom-0 z-[220] px-3 pb-safe">
      <div className="mx-auto mb-3 max-w-lg overflow-hidden rounded-2xl border border-emerald-700/40 bg-[#0b2f22] shadow-2xl">
        <div className="flex items-center gap-3 p-3.5">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-amber-400/50">
            <Image src="/icons/logo.png" alt="TAKA69" fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-white">
              {t(
                "Turn on notifications to claim your exclusive bonus instantly.",
                "এক্সক্লুসিভ বোনাস পেতে নোটিফিকেশন চালু করুন।"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 border-t border-white/10 px-4 py-2.5">
          <button
            type="button"
            onClick={cancel}
            className="text-sm font-semibold text-white/70 hover:text-white"
          >
            {t("Cancel", "বাতিল")}
          </button>
          <button
            type="button"
            onClick={agree}
            disabled={busy}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-black text-emerald-950 active:scale-95 disabled:opacity-60"
          >
            {busy ? "…" : t("Agree", "সম্মত")}
          </button>
        </div>
      </div>
    </div>
  );
}
