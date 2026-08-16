"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

export function AppDownloadModal() {
  const t = useLang((s) => s.t);
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [apkUrl, setApkUrl] = useState("");

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("taka69:open-app-download", onOpen);
    fetch("/api/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((json) => setApkUrl(typeof json.data?.apkUrl === "string" ? json.data.apkUrl : ""))
      .catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("taka69:open-app-download", onOpen);
    };
  }, []);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice.catch(() => undefined);
      setInstallEvent(null);
      setOpen(false);
      return;
    }
    if (apkUrl) {
      window.location.href = apkUrl;
      return;
    }
    window.location.href = "/manifest.webmanifest";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={() => setOpen(false)} aria-label={t("Close", "বন্ধ করুন")} />
      <section className="relative z-10 my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-y-auto rounded-[28px] bg-white text-[#173251] shadow-[0_24px_80px_rgba(15,23,42,0.28)]" role="dialog" aria-modal="true" aria-labelledby="app-download-title">
        <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200" aria-label={t("Close", "বন্ধ করুন")}>
          <X className="h-4 w-4" />
        </button>
        <div className="bg-gradient-to-br from-[#e6f4ff] via-[#f5fbff] to-[#dbe9ff] px-5 pb-5 pt-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[26px] bg-[#2f80c5] text-white shadow-[0_14px_26px_rgba(49,116,219,0.25)]">
            <Download className="h-12 w-12" strokeWidth={2.4} />
          </div>
          <h2 id="app-download-title" className="mt-4 text-xl font-black">{t("Download the app", "অ্যাপ ডাউনলোড করুন")}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6e879d]">{t("Keep TAKA69 close with a faster mobile experience.", "আরও দ্রুত মোবাইল অভিজ্ঞতার জন্য TAKA69 ইনস্টল করুন।")}</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e0ebf4] bg-[#f8fbfe] p-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dceeff] text-[#2f80c5]"><Smartphone className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1"><div className="font-black">{t("Android / mobile app", "অ্যান্ড্রয়েড / মোবাইল অ্যাপ")}</div><div className="mt-0.5 text-[11px] text-[#8ba0b3]">{installEvent || apkUrl ? t("Ready to install", "ইনস্টলের জন্য প্রস্তুত") : t("Use browser install when available", "ব্রাউজার ইনস্টল অপশন ব্যবহার করুন")}</div></div>
          </div>
          <button type="button" onClick={install} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8bd55] px-4 py-3 text-base font-black text-[#102b57] shadow-[0_10px_22px_rgba(196,150,38,0.22)]"><Download className="h-5 w-5" />{t("Install / download", "ডাউনলোড করুন")}</button>
        </div>
      </section>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
