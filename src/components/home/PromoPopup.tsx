"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

export type LaunchPopup = {
  id?: string | number;
  enabled?: boolean;
  imageUrl?: string;
  href?: string;
  titleEn?: string;
  titleBn?: string;
  bodyEn?: string;
  bodyBn?: string;
  showOncePerSession?: boolean;
};

function normalizePopups(raw: unknown): LaunchPopup[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as LaunchPopup[];
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as LaunchPopup[];
    // legacy single popup object
    if (o.enabled !== undefined || o.titleEn || o.imageUrl) {
      return [o as LaunchPopup];
    }
  }
  return [];
}

export function PromoPopup() {
  const t = useLang((s) => s.t);
  const [queue, setQueue] = useState<LaunchPopup[]>([]);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        const list = normalizePopups(j.data.popups ?? j.data.popup);
        const enabled = list.filter((p) => p && p.enabled !== false);
        const unseen: LaunchPopup[] = [];
        for (const p of enabled) {
          const fingerprint = `${p.id || ""}|${p.titleEn || ""}|${p.imageUrl || ""}|${p.href || ""}`;
          if (p.showOncePerSession !== false) {
            const key = `taka69_popup_v2_${btoa(unescape(encodeURIComponent(fingerprint))).slice(0, 56)}`;
            if (sessionStorage.getItem(key)) continue;
            sessionStorage.setItem(key, "1");
          }
          unseen.push(p);
        }
        if (!unseen.length) return;
        setQueue(unseen);
        setIdx(0);
        setTimeout(() => {
          if (!cancelled) setOpen(true);
        }, 350);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const popup = queue[idx];
  if (!open || !popup) return null;

  function close() {
    // show next popup in queue if any
    if (idx + 1 < queue.length) {
      setIdx((i) => i + 1);
      return;
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-gold-500/35 bg-[#0b1710] shadow-2xl animate-pop-in">
        <button
          onClick={close}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/55 p-1.5 text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {queue.length > 1 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white/80">
            {idx + 1}/{queue.length}
          </div>
        )}
        {popup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imageUrl} alt="promo" className="h-48 w-full object-cover" />
        ) : (
          <div className="h-28 w-full bg-gradient-to-br from-amber-500/40 to-emerald-900" />
        )}
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-black text-gold-300">
            {t(popup.titleEn || "Promotion", popup.titleBn || "প্রমোশন")}
          </h3>
          {(popup.bodyEn || popup.bodyBn) && (
            <p className="text-sm text-emerald-100/75">{t(popup.bodyEn || "", popup.bodyBn || "")}</p>
          )}
          {popup.href ? (
            <Link
              href={popup.href}
              onClick={close}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-emerald-950"
            >
              {t("Open", "খুলুন")}
            </Link>
          ) : (
            <button
              onClick={close}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-emerald-950"
            >
              {idx + 1 < queue.length ? t("Next", "পরবর্তী") : t("Got it", "বুঝেছি")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
