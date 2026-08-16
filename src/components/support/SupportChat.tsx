"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, ImagePlus, Send, X } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

type Msg = {
  id: string;
  sender: string;
  message: string;
  imageUrl?: string | null;
  createdAt: string;
  agentName?: string | null;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SupportChat({
  open,
  onClose,
  floating = true,
}: {
  open?: boolean;
  onClose?: () => void;
  floating?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onClose && !v) onClose();
    setInternalOpen(v);
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!user) return;
    const res = await fetch("/api/support", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setMessages(json.data.messages || []);
  }

  useEffect(() => {
    if (isOpen && user) {
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }
  }, [isOpen, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function onPick(file?: File | null) {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error(t("Image too large", "ছবি অনেক বড়"), "Max 2.5MB");
      return;
    }
    setImage(await fileToDataUrl(file));
  }

  async function send() {
    if ((!text.trim() && !image) || !user) return;
    setLoading(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: text.trim(), image: image || undefined }),
    });
    const json = await res.json();
    if (json.ok) {
      setText("");
      setImage("");
      await load();
    } else {
      toast.error(json.error || "Failed");
    }
    setLoading(false);
  }

  return (
    <>
      {floating && !isOpen && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-3 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#102b57] text-white shadow-lg ring-4 ring-[#8bbce8]/50"
          aria-label="Support"
        >
          <Headphones className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/20 sm:items-center sm:p-3">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-[min(78dvh,720px)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#294f83] bg-[#102b57] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:h-[min(70vh,720px)] sm:rounded-3xl sm:pb-0">
            <div className="flex shrink-0 items-center justify-between border-b border-[#294f83] bg-[#173b70] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8bbce8]/20 text-[#dceeff]"><Headphones className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{t("Live Support", "লাইভ সাপোর্ট")}</div>
                  <div className="truncate text-[10px] text-[#b9d8f3]">{t("Screenshots auto-delete in 24h", "স্ক্রিনশট ২৪ ঘণ্টায় অটো-ডিলিট")}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-2 text-white hover:bg-white/10" aria-label={t("Close", "বন্ধ করুন")}><X className="h-5 w-5" /></button>
            </div>

            {!user ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-[#dceeff]">{t("Login to chat with support", "সাপোর্টে চ্যাট করতে লগইন করুন")}</p>
                <Link href="/login"><Button variant="gold">{t("Login", "লগইন")}</Button></Link>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.length === 0 && (
                    <div className="rounded-2xl border border-[#294f83] bg-[#173b70] p-3 text-xs text-[#dceeff]">
                      {t("Hi! Ask about games, wallet requests, or your account. Virtual TK only.", "হাই! গেম, ওয়ালেট রিকোয়েস্ট বা অ্যাকাউন্ট নিয়ে জিজ্ঞাসা করুন। শুধু ভার্চুয়াল TK।")}
                    </div>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender === "USER";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] break-words rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#2f80c5] text-white" : "border border-[#294f83] bg-[#173b70] text-[#f5fbff]"}`}>
                          {!mine && m.agentName && <div className="mb-0.5 text-[10px] font-bold text-[#f5d988]">{m.agentName}</div>}
                          {m.message && m.message !== "[image]" && <div>{m.message}</div>}
                          {m.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.imageUrl} alt="attachment" className="mt-1 max-h-40 rounded-lg object-contain" />
                          )}
                          <div className={`mt-1 text-[9px] ${mine ? "text-white/70" : "text-[#b9d8f3]/60"}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                {image && (
                  <div className="shrink-0 px-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="preview" className="h-16 rounded-lg border border-[#294f83] object-cover" />
                  </div>
                )}
                <div className="shrink-0 border-t border-[#294f83] p-3">
                  <div className="flex min-w-0 gap-2">
                    <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#537da8] bg-[#0c2347] text-[#dceeff]">
                      <ImagePlus className="h-4 w-4" />
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
                    </label>
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder={t("Type a message…", "মেসেজ লিখুন…")}
                      className="min-w-0 flex-1 rounded-xl border border-[#537da8] bg-[#0c2347] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#b9d8f3]/60 focus:border-[#e8bd55]"
                    />
                    <Button onClick={send} disabled={loading || (!text.trim() && !image)} className="shrink-0 px-3"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
