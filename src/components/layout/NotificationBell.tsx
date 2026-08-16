"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, X, Smartphone } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import Link from "next/link";

type N = {
  id: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  read: boolean;
  createdAt: string;
  global: boolean;
  href?: string | null;
  imageUrl?: string | null;
};

const SEEN_KEY = "taka69_notif_seen_v3";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(s: Set<string>) {
  if (typeof window === "undefined") return;
  const arr = Array.from(s).slice(-300);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function ensureSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

async function showNative(title: string, body: string, tag?: string, href?: string, image?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const reg = await ensureSW();
  try {
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: image || "/icons/icon-192.png",
        badge: "/icons/favicon-32.png",
        // @ts-expect-error image option
        image: image || undefined,
        tag: tag || undefined,
        data: { href: href || "/" },
        vibrate: [120, 60, 120],
      });
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, {
      body,
      icon: image || "/icons/icon-192.png",
      // @ts-expect-error image
      image: image || undefined,
      tag,
      data: { href },
    });
  } catch {
    try {
      new Notification(title, { body, icon: "/icons/icon-192.png", tag });
    } catch {
      /* */
    }
  }
}

async function subscribeWebPush(): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push not supported on this browser" };
  }
  const reg = await ensureSW();
  if (!reg) return { ok: false, error: "Service worker failed" };

  const keyRes = await fetch("/api/push/subscribe", { credentials: "include" });
  const keyJson = await keyRes.json();
  if (!keyJson.ok || !keyJson.data?.publicKey) {
    return { ok: false, error: keyJson.error || "No VAPID key" };
  }
  const publicKey = keyJson.data.publicKey as string;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, error: "Invalid subscription" };
  }
  const save = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
  const saved = await save.json();
  if (!saved.ok) return { ok: false, error: saved.error || "Save failed" };
  return { ok: true };
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [pushOn, setPushOn] = useState(false);
  const seen = useRef<Set<string>>(loadSeen());
  const booted = useRef(false);

  async function load(opts: { pushNew?: boolean } = {}) {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const json = await res.json();
      if (!json.ok) return;
      const list: N[] = json.data.notifications || [];
      setItems(list);
      setUnread(json.data.unread || 0);

      if (opts.pushNew && booted.current) {
        for (const n of list.filter((x) => !x.read)) {
          if (seen.current.has(n.id)) continue;
          seen.current.add(n.id);
          saveSeen(seen.current);
          const title = lang === "bn" ? n.titleBn : n.titleEn;
          const body = lang === "bn" ? n.bodyBn : n.bodyEn;
          await showNative(title, body, n.id, n.href || "/", n.imageUrl || undefined);
          if (!document.hidden) toast.info(title, body);
        }
      } else {
        for (const n of list) seen.current.add(n.id);
        saveSeen(seen.current);
        booted.current = true;
      }
    } catch {
      /* */
    }
  }

  useEffect(() => {
    ensureSW();
    if (typeof window !== "undefined" && "Notification" in window) setPerm(Notification.permission);
    else setPerm("unsupported");
  }, []);

  useEffect(() => {
    if (!user) return;
    load({ pushNew: false });
    const id = setInterval(() => load({ pushNew: true }), 8000);
    const onVis = () => {
      if (!document.hidden) load({ pushNew: true });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, lang]);

  async function enablePush() {
    if (!("Notification" in window)) {
      toast.error(t("Not supported", "সাপোর্টেড নয়"));
      return;
    }
    await ensureSW();
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p !== "granted") {
      toast.error(
        t("Permission denied", "অনুমতি দেওয়া হয়নি"),
        t("Allow notifications in browser settings", "ব্রাউজার সেটিংসে নোটিফিকেশন চালু করুন")
      );
      return;
    }
    const sub = await subscribeWebPush();
    if (!sub.ok) {
      toast.error(t("Push subscribe failed", "পুশ সাবস্ক্রাইব ব্যর্থ"), sub.error);
      await showNative("TAKA69", t("Local alerts on", "লোকাল অ্যালার্ট চালু"), "push-local", "/");
      return;
    }
    setPushOn(true);
    toast.success(
      t("Notifications on", "নোটিফিকেশন চালু"),
      t("You get alerts even when the app is closed", "অ্যাপ বন্ধ থাকলেও অ্যালার্ট পাবেন")
    );
    await showNative("TAKA69", t("Push enabled", "পুশ চালু হয়েছে"), "push-on", "/");
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ all: true }),
    });
    items.forEach((n) => seen.current.add(n.id));
    saveSeen(seen.current);
    await load({ pushNew: false });
  }

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (next) await markAll();
  }

  async function openItem(n: N) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: n.id }),
    });
    seen.current.add(n.id);
    saveSeen(seen.current);
    setOpen(false);
    await load({ pushNew: false });
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={openPanel}
        className="relative rounded-xl p-2 text-blue-100 hover:bg-white/10"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing className="h-4 w-4 text-gold-300" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[9px] font-black text-[#102b57] shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Deep frosted backdrop like JETA7 */}
          <div
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-2xl"
            style={{ backdropFilter: "blur(20px) saturate(140%)", WebkitBackdropFilter: "blur(20px) saturate(140%)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel — navy glass, high contrast text */}
          <div
            className="fixed left-3 right-3 top-16 z-[90] mx-auto max-w-lg overflow-hidden rounded-3xl shadow-[0_28px_90px_rgba(0,0,0,0.9)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none"
            style={{
              background: "linear-gradient(180deg, rgba(16,43,87,0.98) 0%, rgba(7,20,38,0.99) 100%)",
              backdropFilter: "blur(48px) saturate(200%)",
              WebkitBackdropFilter: "blur(48px) saturate(200%)",
              border: "1px solid rgba(125,196,238,0.22)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 24px 80px rgba(0,0,0,0.85)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-white/10 px-4 py-3"
              style={{ background: "rgba(16, 43, 87, 0.90)" }}
            >
              <div>
                <div className="text-sm font-black text-white">{t("Notifications", "নোটিফিকেশন")}</div>
                <div className="text-[10px] text-blue-100/70">
                  {pushOn || perm === "granted"
                    ? t("Push ready", "পুশ রেডি")
                    : t("Enable push for mobile alerts", "মোবাইল অ্যালার্টের জন্য পুশ চালু করুন")}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/10">
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>

            {perm !== "granted" && perm !== "unsupported" && (
              <button
                onClick={enablePush}
                className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 text-left text-[11px] font-semibold text-gold-300"
                style={{ background: "rgba(251,191,36,0.12)" }}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                {t("Enable mobile push (required once)", "মোবাইল পুশ একবার চালু করুন")}
              </button>
            )}
            {perm === "granted" && !pushOn && (
              <button
                onClick={enablePush}
                className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 text-left text-[11px] font-semibold text-blue-100"
                style={{ background: "rgba(125,196,238,0.10)" }}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                {t("Refresh push subscription", "পুশ সাবস্ক্রিপশন রিফ্রেশ")}
              </button>
            )}

            <div className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const title = lang === "bn" ? n.titleBn : n.titleEn;
                const body = lang === "bn" ? n.bodyBn : n.bodyEn;
                const inner = (
                  <div
                    className={cn(
                      "border-b border-white/[0.06] px-4 py-3.5 cursor-pointer transition",
                      !n.read
                        ? "bg-[#2f80c5]/[0.16] hover:bg-[#2f80c5]/[0.24]"
                        : "hover:bg-white/[0.05]"
                    )}
                    onClick={() => openItem(n)}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400 shadow-gold" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-white leading-snug drop-shadow-sm">{title}</div>
                        <div className="mt-0.5 text-[12px] text-blue-50/85 leading-relaxed">{body}</div>
                        {n.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="mt-2 h-20 w-full rounded-lg object-cover border border-white/10"
                          />
                        ) : null}
                        <div className="mt-1 text-[10px] text-blue-100/45">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => openItem(n)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
              {!items.length && (
                <p className="p-8 text-center text-xs text-blue-100/55">
                  {t("No notifications yet", "এখনো কোনো নোটিফিকেশন নেই")}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
