"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
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
        const list = normalizePopups(j.data.popups ?? j.data.popup ?? j.data.popupConfig);
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
        }, 200);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const popup = queue[idx];

  function close() {
    // show next popup in queue if any
    if (idx + 1 < queue.length) {
      setIdx((i) => i + 1);
      return;
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, idx, queue.length]);

  if (!open || !popup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
        onClick={close}
        aria-label={t("Close promotion", "প্রমোশন বন্ধ করুন")}
      />
      <section
        className="relative z-10 my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-y-auto rounded-[28px] border border-[#d7e5f1] bg-white text-[#173251] shadow-[0_24px_70px_rgba(15,23,42,0.24)] animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#53708d] shadow-sm ring-1 ring-[#d7e5f1] transition hover:bg-white hover:text-[#102b57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80c5]"
          aria-label={t("Close", "বন্ধ করুন")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {queue.length > 1 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200">
            {idx + 1}/{queue.length}
          </div>
        )}
        {popup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imageUrl} alt={t("Promotion", "প্রমোশন")} className="h-44 w-full object-cover sm:h-48" />
        ) : (
          <div className="h-28 w-full bg-gradient-to-br from-[#dceeff] via-[#f5fbff] to-[#fff1c9]" aria-hidden="true" />
        )}
        <div className="space-y-3 p-4 sm:p-5">
          <div>
            <h2 id="promo-popup-title" className="text-lg font-black leading-7 text-slate-900">
              {t(popup.titleEn || "Promotion", popup.titleBn || "প্রমোশন")}
            </h2>
            {(popup.bodyEn || popup.bodyBn) && (
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                {t(popup.bodyEn || "", popup.bodyBn || "")}
              </p>
            )}
          </div>
          {popup.href ? (
            <Link
              href={popup.href}
              onClick={close}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e6f4ff] px-4 py-3 text-sm font-black text-[#1f5d98] transition hover:bg-[#dceeff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f80c5]"
            >
              {t("Open promotion", "অফারটি দেখুন")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={close}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-black text-[#9a6b00] transition hover:bg-[#fff1c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8bd55]"
            >
              {idx + 1 < queue.length ? t("Next", "পরবর্তী") : t("Got it", "বুঝেছি")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
