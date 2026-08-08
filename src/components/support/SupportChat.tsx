"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Send, X } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Msg = {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
};

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
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onClose && !v) onClose();
    setInternalOpen(v);
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
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

  async function send() {
    if (!text.trim() || !user) return;
    setLoading(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: text.trim() }),
    });
    const json = await res.json();
    if (json.ok) {
      setText("");
      await load();
    }
    setLoading(false);
  }

  return (
    <>
      {floating && !isOpen && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-3 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-glow ring-4 ring-emerald-950/80"
          aria-label="Support"
        >
          <Headphones className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-emerald-700/40 bg-[#0a1610] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-emerald-800/50 bg-gradient-to-r from-emerald-900 to-emerald-950 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {t("Live Support", "লাইভ সাপোর্ট")}
                  </div>
                  <div className="text-[10px] text-emerald-300">
                    {t("Usually replies in minutes", "সাধারণত কয়েক মিনিটে উত্তর")}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-emerald-100/80">
                  {t("Login to chat with support", "সাপোর্টে চ্যাট করতে লগইন করুন")}
                </p>
                <Link href="/login">
                  <Button variant="gold">{t("Login", "লগইন")}</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.length === 0 && (
                    <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/40 p-3 text-xs text-emerald-100/70">
                      {t(
                        "Hi! Ask about games, wallet requests, or your account. Play-money only.",
                        "হাই! গেম, ওয়ালেট রিকোয়েস্ট বা অ্যাকাউন্ট নিয়ে জিজ্ঞাসা করুন। শুধু প্লে-মানি।"
                      )}
                    </div>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender === "USER";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-950 border border-emerald-800 text-emerald-50"
                          }`}
                        >
                          {m.message}
                          <div className={`mt-1 text-[9px] ${mine ? "text-white/70" : "text-emerald-200/40"}`}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                <div className="border-t border-emerald-800/50 p-3">
                  <div className="flex gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      placeholder={t("Type a message…", "মেসেজ লিখুন…")}
                      className="flex-1 rounded-xl border border-emerald-700/40 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                    />
                    <Button onClick={send} disabled={loading || !text.trim()} className="px-3">
                      <Send className="h-4 w-4" />
                    </Button>
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
