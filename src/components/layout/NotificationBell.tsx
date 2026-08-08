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
};

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

async function showNative(title: string, body: string, tag?: string, href?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const reg = await ensureSW();
  if (reg && reg.active) {
    reg.active.postMessage({ type: "NOTIFY", title, body, tag, href });
    return;
  }
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png", tag });
  } catch {
    /* ignore */
  }
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
  const seen = useRef<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  async function load(silent = true) {
    if (!user) return;
    const res = await fetch("/api/notifications", { credentials: "include" });
    const json = await res.json();
    if (!json.ok) return;
    const list: N[] = json.data.notifications || [];
    setItems(list);
    setUnread(json.data.unread || 0);

    // Push to OS notification center when new unread arrives (works if permission granted)
    for (const n of list.filter((x) => !x.read)) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      const title = lang === "bn" ? n.titleBn : n.titleEn;
      const body = lang === "bn" ? n.bodyBn : n.bodyEn;
      if (!silent) toast.info(title, body);
      // Always try native when document hidden or not silent first load of new items
      if (document.hidden || !silent) {
        await showNative(title, body, n.id, n.href || "/");
      }
    }
  }

  useEffect(() => {
    ensureSW();
    if (typeof window !== "undefined" && "Notification" in window) setPerm(Notification.permission);
    else setPerm("unsupported");
  }, []);

  useEffect(() => {
    if (!user) return;
    load(false);
    const id = setInterval(() => load(true), 8000);
    const onVis = () => {
      if (!document.hidden) load(true);
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
    if (p === "granted") {
      toast.success(
        t("Notifications on", "নোটিফিকেশন চালু"),
        t("Alerts on phone even if tab is closed (browser must allow)", "ট্যাব বন্ধ থাকলেও অ্যালার্ট (ব্রাউজার অনুমতি দরকার)")
      );
      await showNative("TAKA69", t("Push enabled", "পুশ চালু হয়েছে"), "push-on", "/");
    }
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ all: true }),
    });
    load(true);
  }

  async function openItem(n: N) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: n.id }),
    });
    setOpen(false);
    load(true);
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load(true);
        }}
        className="relative rounded-xl p-2 text-emerald-100 hover:bg-white/5"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing className="h-4 w-4 text-gold-300 animate-pulse" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 z-[90] mx-auto max-w-lg overflow-hidden rounded-3xl border border-emerald-700/50 bg-[#07140e]/98 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none">
            <div className="flex items-center justify-between border-b border-emerald-800/80 bg-gradient-to-r from-emerald-950 to-emerald-900 px-4 py-3">
              <div>
                <div className="text-sm font-black text-white">{t("Notifications", "নোটিফিকেশন")}</div>
                <div className="text-[10px] text-emerald-300/70">
                  {unread} {t("unread", "অপঠিত")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAll} className="text-[10px] font-bold text-gold-300">
                  {t("Mark all", "সব পঠিত")}
                </button>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {perm !== "granted" && perm !== "unsupported" && (
              <button
                onClick={enablePush}
                className="flex w-full items-center gap-2 border-b border-emerald-900 bg-gold-500/15 px-4 py-3 text-left text-[11px] font-semibold text-gold-300"
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                {t(
                  "Enable mobile/browser push (works when app is in background)",
                  "মোবাইল/ব্রাউজার পুশ চালু করুন (ব্যাকগ্রাউন্ডেও কাজ করে)"
                )}
              </button>
            )}

            <div className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const title = lang === "bn" ? n.titleBn : n.titleEn;
                const body = lang === "bn" ? n.bodyBn : n.bodyEn;
                const inner = (
                  <div
                    className={cn(
                      "border-b border-emerald-900/40 px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition",
                      !n.read && "bg-emerald-500/[0.07]"
                    )}
                    onClick={() => openItem(n)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white leading-snug">{title}</div>
                        <div className="mt-0.5 text-xs text-emerald-100/70 leading-relaxed">{body}</div>
                        <div className="mt-1 text-[10px] text-emerald-200/40">
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
                <p className="p-8 text-center text-xs text-emerald-200/50">
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
