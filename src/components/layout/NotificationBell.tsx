"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
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

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const lang = useLang((s) => s.lang);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const seen = useState<Set<string>>(() => new Set())[0];

  async function load(silent = true) {
    if (!user) return;
    const res = await fetch("/api/notifications", { credentials: "include" });
    const json = await res.json();
    if (!json.ok) return;
    const list: N[] = json.data.notifications || [];
    setItems(list);
    setUnread(json.data.unread || 0);
    if (!silent) {
      for (const n of list.filter((x) => !x.read).slice(0, 3)) {
        if (seen.has(n.id)) continue;
        seen.add(n.id);
        const title = lang === "bn" ? n.titleBn : n.titleEn;
        const body = lang === "bn" ? n.bodyBn : n.bodyEn;
        toast.info(title, body);
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(title, { body, icon: "/icons/icon-192.png", tag: n.id });
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPerm(Notification.permission);
    } else {
      setPerm("unsupported");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    load(false);
    const id = setInterval(() => load(true), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function enablePush() {
    if (!("Notification" in window)) {
      toast.error(t("Not supported", "সাপোর্টেড নয়"));
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      toast.success(t("Notifications on", "নোটিফিকেশন চালু"), t("You will get browser alerts", "ব্রাউজার অ্যালার্ট পাবেন"));
      try {
        new Notification("TAKA69", {
          body: t("Push enabled", "পুশ চালু হয়েছে"),
          icon: "/icons/icon-192.png",
        });
      } catch {
        /* ignore */
      }
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
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load(true);
        }}
        className="relative rounded-xl p-2 text-emerald-100 hover:bg-white/5"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing className="h-4 w-4 text-gold-300" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-emerald-800 bg-[#0b1710] shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900 px-3 py-2">
              <span className="text-sm font-bold">{t("Notifications", "নোটিফিকেশন")}</span>
              <button onClick={markAll} className="text-[10px] text-gold-300 font-semibold">
                {t("Mark all read", "সব পঠিত")}
              </button>
            </div>
            {perm !== "granted" && perm !== "unsupported" && (
              <button
                onClick={enablePush}
                className="w-full border-b border-emerald-900 bg-gold-500/10 px-3 py-2 text-left text-[11px] font-semibold text-gold-300"
              >
                {t("Enable browser push notifications", "ব্রাউজার পুশ নোটিফিকেশন চালু করুন")}
              </button>
            )}
            <div className="max-h-80 overflow-y-auto">
              {items.map((n) => {
                const inner = (
                  <div
                    className={cn(
                      "border-b border-emerald-900/50 px-3 py-2.5 cursor-pointer hover:bg-white/5",
                      !n.read && "bg-emerald-500/5"
                    )}
                    onClick={() => openItem(n)}
                  >
                    <div className="text-sm font-semibold text-white">
                      {lang === "bn" ? n.titleBn : n.titleEn}
                    </div>
                    <div className="text-xs text-emerald-100/70 mt-0.5">
                      {lang === "bn" ? n.bodyBn : n.bodyEn}
                    </div>
                    <div className="text-[10px] text-emerald-200/40 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
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
                <p className="p-4 text-center text-xs text-emerald-200/50">
                  {t("No notifications", "কোনো নোটিফিকেশন নেই")}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
