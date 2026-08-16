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

/**
 * Bottom notification permission sheet (JETA7-style).
 * Show when permission is default OR denied (re-prompt UX).
 * Hide only when already granted.
 */
export function NotificationPrompt() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    // Already allowed → never show
    if (Notification.permission === "granted") return;

    // User dismissed this session
    if (sessionStorage.getItem("taka69_push_prompt_session") === "1") return;

    // Soft cooldown after cancel (24h) — still show if never decided or default
    const dismissedAt = Number(localStorage.getItem("taka69_push_dismissed_at") || 0);
    if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;

    // Only hide permanently if they previously granted (handled above)
    // Show for default and denied so user can still open settings path
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  async function agree() {
    if (busy) return;
    setBusy(true);
    try {
      sessionStorage.setItem("taka69_push_prompt_session", "1");

      if (!("Notification" in window)) {
        setOpen(false);
        setBusy(false);
        return;
      }

      // If already denied, browsers block requestPermission — guide user
      if (Notification.permission === "denied") {
        alert(
          t(
            "Notifications are blocked. Enable them in your browser site settings, then reload.",
            "নোটিফিকেশন ব্লক করা আছে। ব্রাউজার সাইট সেটিংস থেকে চালু করে রিলোড করুন।"
          )
        );
        setOpen(false);
        setBusy(false);
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        localStorage.setItem("taka69_push_dismissed_at", String(Date.now()));
        setOpen(false);
        setBusy(false);
        return;
      }

      localStorage.removeItem("taka69_push_dismissed_at");
      localStorage.setItem("taka69_push_prompt", "1");

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setOpen(false);
        setBusy(false);
        return;
      }

      await navigator.serviceWorker.register("/sw.js").catch(() => null);
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push/subscribe", { credentials: "include" });
      const keyJson = await keyRes.json().catch(() => null);
      const publicKey = keyJson?.data?.publicKey as string | undefined;
      if (publicKey) {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }
        if (user && sub) {
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
    sessionStorage.setItem("taka69_push_prompt_session", "1");
    localStorage.setItem("taka69_push_dismissed_at", String(Date.now()));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[240] px-0 pb-0">
      <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-t-3xl border border-[#dce8f2] bg-white shadow-[0_-12px_40px_rgba(16,43,87,0.22)]">
        <div className="flex items-center gap-3 px-4 pb-2 pt-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-[#dce8f2]">
            <Image
              src={brand.logoUrl || "/icons/logo.png"}
              alt={brand.siteName || "TAKA69"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#173251]">
            {t(
              "Turn on notifications for the full experience!",
              "পূর্ণ অভিজ্ঞতা উপভোগ করতে নোটিফিকেশন চালু করুন!"
            )}
          </p>
        </div>
        <div className="flex items-center justify-end gap-6 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={cancel}
            className="text-[15px] font-semibold text-[#68839d] hover:text-[#294765]"
          >
            {t("Cancel", "বাতিল করুন")}
          </button>
          <button
            type="button"
            onClick={() => void agree()}
            disabled={busy}
            className="min-w-[108px] rounded-xl bg-gradient-to-b from-[#f4d27a] to-[#e8bd55] px-5 py-2.5 text-[15px] font-bold text-[#102b57] shadow-md shadow-[#d89224]/25 active:scale-95 disabled:opacity-60"
          >
            {busy ? "…" : t("Agree", "সম্মতি")}
          </button>
        </div>
      </div>
    </div>
  );
}
