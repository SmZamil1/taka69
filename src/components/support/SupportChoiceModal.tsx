import { Facebook, Headphones, MessageCircle, Send, X } from "lucide-react";
import { useBrand } from "@/hooks/useBrand";
import { useLang } from "@/hooks/useLang";

export function SupportChoiceModal({ open, onClose, onOpenChat }: { open: boolean; onClose: () => void; onOpenChat: () => void }) {
  const t = useLang((s) => s.t);
  const brand = useBrand();
  if (!open) return null;
  const options = [
    { label: t("Online CS 24/7", "অনলাইন CS ৭×২৪"), icon: Headphones, className: "bg-[#e6f4ff] text-[#1f5d98]", onClick: onOpenChat },
    { label: t("WhatsApp channel", "WhatsApp চ্যানেল"), icon: MessageCircle, className: "bg-[#eef5fb] text-[#244d7a]", href: brand.whatsappUrl || "https://wa.me/" },
    { label: t("Telegram channel", "Telegram চ্যানেল"), icon: Send, className: "bg-[#dceeff] text-[#1f5d98]", href: brand.telegramUrl || "https://t.me/" },
    { label: t("Official Facebook", "অফিশিয়াল Facebook"), icon: Facebook, className: "bg-[#fff7df] text-[#9a6b00]", href: "https://www.facebook.com/" },
  ];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={t("Close", "বন্ধ করুন")} />
      <section className="relative z-10 my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-[28px] bg-white p-5 text-[#173251] shadow-[0_24px_80px_rgba(15,23,42,0.3)]" role="dialog" aria-modal="true" aria-labelledby="support-choice-title">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5fb] text-[#53708d]" aria-label={t("Close", "বন্ধ করুন")}><X className="h-5 w-5" /></button>
        <h2 id="support-choice-title" className="mb-5 pr-10 text-center text-2xl font-black text-[#173251]">{t("Choose customer service", "গ্রাহক সেবা নির্বাচন করুন")}</h2>
        <div className="space-y-3">
          {options.map(({ label, icon: Icon, className, href, onClick }) => href ? <a key={label} href={href} target="_blank" rel="noreferrer" onClick={onClose} className={`flex min-h-16 items-center gap-4 rounded-2xl px-4 text-base font-bold shadow-sm sm:px-5 sm:text-lg ${className}`}><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70"><Icon className="h-6 w-6" /></span><span className="min-w-0">{label}</span></a> : <button key={label} type="button" onClick={onClick} className={`flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 text-left text-base font-bold shadow-sm sm:px-5 sm:text-lg ${className}`}><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70"><Icon className="h-6 w-6" /></span><span className="min-w-0">{label}</span></button>)}
        </div>
      </section>
    </div>
  );
}
