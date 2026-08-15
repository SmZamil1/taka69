"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Thread = {
  userId: string;
  username: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Msg = {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
  agentName?: string | null;
};

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadThreads() {
    const res = await fetch("/api/support?admin=1", { credentials: "include" });
    const json = await res.json();
    if (json.ok) setThreads(json.data.threads || []);
  }

  async function loadMessages(userId: string) {
    setActive(userId);
    const res = await fetch(`/api/support?admin=1&userId=${userId}`, {
      credentials: "include",
    });
    const json = await res.json();
    if (json.ok) setMessages(json.data.messages || []);
  }

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => loadMessages(active), 3000);
    return () => clearInterval(id);
  }, [active]);

  async function send() {
    if (!active || !text.trim() || sending) return;
    setSending(true);
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: active, message: text.trim() }),
    });
    setText("");
    setSending(false);
    loadMessages(active);
    loadThreads();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-amber-300">Support desk</h1>
        <p className="text-xs text-white/40">
          Replies show your staff name · user gets an instant notification
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:col-span-1">
          {threads.map((th) => (
            <button
              key={th.userId}
              type="button"
              onClick={() => loadMessages(th.userId)}
              className={cn(
                "w-full rounded-xl border p-3 text-left text-sm transition",
                active === th.userId
                  ? "border-amber-400/50 bg-amber-400/10"
                  : "border-white/10 bg-black/20 hover:bg-white/5"
              )}
            >
              <div className="flex justify-between font-bold">
                <span>{th.username}</span>
                {th.unread > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
                    {th.unread}
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-white/50">{th.lastMessage}</div>
            </button>
          ))}
          {!threads.length && <p className="p-2 text-sm text-white/40">No chats yet</p>}
        </div>
        <div className="flex min-h-[50vh] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-white/40">
              Select a thread
            </div>
          ) : (
            <>
              <div className="mb-3 flex-1 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.sender === "SUPPORT" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        m.sender === "SUPPORT"
                          ? "bg-emerald-500 text-white"
                          : "border border-white/10 bg-black/30"
                      )}
                    >
                      {m.sender === "SUPPORT" && m.agentName && (
                        <div className="mb-0.5 text-[10px] font-bold opacity-80">
                          {m.agentName}
                        </div>
                      )}
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Reply as your staff name…"
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button onClick={send} disabled={sending}>
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
