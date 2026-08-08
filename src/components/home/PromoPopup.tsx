"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

type Popup = {
  enabled?: boolean;
  imageUrl?: string;
  href?: string;
  titleEn?: string;
  titleBn?: string;
  bodyEn?: string;
  bodyBn?: string;
  showOncePerSession?: boolean;
};

export function PromoPopup() {
  const t = useLang((s) => s.t);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        const p: Popup = j.data.popup || {};
        if (!p.enabled) return;
        if (p.showOncePerSession !== false) {
          const key = "taka69_popup_seen";
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, "1");
        }
        setPopup(p);
        setTimeout(() => setOpen(true), 600);
      })
      .catch(() => {});
  }, []);

  if (!open || !popup) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-gold-500/30 bg-[#0b1710] shadow-2xl animate-pop-in">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {popup.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.imageUrl} alt="promo" className="h-44 w-full object-cover" />
        )}
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-black text-gold-300">
            {t(popup.titleEn || "Promotion", popup.titleBn || "প্রমোশন")}
          </h3>
          <p className="text-sm text-emerald-100/75">
            {t(popup.bodyEn || "", popup.bodyBn || "")}
          </p>
          {popup.href && (
            <Link
              href={popup.href}
              onClick={() => setOpen(false)}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-emerald-950"
            >
              {t("Open", "খুলুন")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
