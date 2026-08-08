"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Thread = {
  userId: string;
  username: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Msg = { id: string; sender: string; message: string; createdAt: string };

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  async function loadThreads() {
    const res = await fetch("/api/support?admin=1", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setThreads(json.data.threads || []);
  }

  async function loadMessages(userId: string) {
    setActive(userId);
    const res = await fetch(`/api/support?admin=1&userId=${userId}`, { credentials: "include" });
    const json = await res.json();
    if (json.ok) setMessages(json.data.messages || []);
  }

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => loadMessages(active), 4000);
    return () => clearInterval(id);
  }, [active]);

  async function send() {
    if (!active || !text.trim()) return;
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: active, message: text.trim() }),
    });
    setText("");
    loadMessages(active);
    loadThreads();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold-400">Live Support</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-3 md:col-span-1 max-h-[70vh] overflow-y-auto space-y-2">
          {threads.map((th) => (
            <button
              key={th.userId}
              onClick={() => loadMessages(th.userId)}
              className={`w-full rounded-xl p-3 text-left text-sm border ${
                active === th.userId ? "border-gold-400 bg-gold-500/10" : "border-emerald-900 bg-black/20"
              }`}
            >
              <div className="flex justify-between font-bold">
                <span>{th.username}</span>
                {th.unread > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{th.unread}</span>
                )}
              </div>
              <div className="truncate text-xs text-emerald-200/60">{th.lastMessage}</div>
            </button>
          ))}
          {!threads.length && <p className="text-sm text-emerald-200/50 p-2">No chats yet</p>}
        </div>
        <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-3 md:col-span-2 flex flex-col min-h-[50vh]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-emerald-200/50">Select a thread</div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto mb-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "SUPPORT" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender === "SUPPORT" ? "bg-emerald-500 text-white" : "bg-black/30 border border-emerald-800"
                    }`}>
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send}>Send</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
