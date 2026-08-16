"use client";

import { Facebook, Headphones, MessageCircle, Send, X } from "lucide-react";
import { useBrand } from "@/hooks/useBrand";
import { useLang } from "@/hooks/useLang";

export function SupportChoiceModal({ open, onClose, onOpenChat }: { open: boolean; onClose: () => void; onOpenChat: () => void }) {
  const t = useLang((s) => s.t);
  const brand = useBrand();
  if (!open) return null;
  const options = [
    { label: t("Online CS 24/7", "অনলাইন CS ৭×২৪"), icon: Headphones, className: "bg-[#fff0ed] text-[#ed4b39]", onClick: onOpenChat },
    { label: t("WhatsApp channel", "WhatsApp চ্যানেল"), icon: MessageCircle, className: "bg-[#edf0ff] text-[#5667e8]", href: brand.whatsappUrl || "https://wa.me/" },
    { label: t("Telegram channel", "Telegram চ্যানেল"), icon: Send, className: "bg-[#fff4dc] text-[#f39a00]", href: brand.telegramUrl || "https://t.me/" },
    { label: t("Official Facebook", "অফিশিয়াল Facebook"), icon: Facebook, className: "bg-[#e4f8f1] text-[#12b980]", href: "https://www.facebook.com/" },
  ];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={t("Close", "বন্ধ করুন")} />
      <section className="relative z-10 w-full max-w-sm rounded-[28px] bg-white p-5 text-slate-700 shadow-[0_24px_80px_rgba(0,0,0,0.3)]" role="dialog" aria-modal="true" aria-labelledby="support-choice-title">
        <button type="button" onClick={onClose} className="absolute -right-1 -top-12 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-transparent text-white" aria-label={t("Close", "বন্ধ করুন")}><X className="h-6 w-6" /></button>
        <h2 id="support-choice-title" className="mb-5 text-center text-2xl font-black text-slate-700">{t("Choose customer service", "গ্রাহক সেবা নির্বাচন করুন")}</h2>
        <div className="space-y-3">
          {options.map(({ label, icon: Icon, className, href, onClick }) => href ? <a key={label} href={href} target="_blank" rel="noreferrer" onClick={onClose} className={`flex min-h-16 items-center gap-4 rounded-2xl px-5 text-lg font-bold shadow-sm ${className}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-current/15"><Icon className="h-6 w-6" /></span>{label}</a> : <button key={label} type="button" onClick={onClick} className={`flex min-h-16 w-full items-center gap-4 rounded-2xl px-5 text-left text-lg font-bold shadow-sm ${className}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-current/15"><Icon className="h-6 w-6" /></span>{label}</button>)}
        </div>
      </section>
    </div>
  );
}
