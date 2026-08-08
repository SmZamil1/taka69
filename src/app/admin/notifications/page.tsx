"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";

export default function AdminNotificationsPage() {
  const toast = useToast();
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyBn, setBodyBn] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(global = true) {
    setLoading(true);
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        titleEn,
        titleBn,
        bodyEn,
        bodyBn,
        global,
        userId: userId || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      toast.error("Failed", json.error);
      return;
    }
    toast.success(global ? "Broadcast sent" : "User notified");
    setTitleEn("");
    setTitleBn("");
    setBodyEn("");
    setBodyBn("");
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-black text-gold-400">Push Notifications</h1>
      <p className="text-xs text-emerald-200/50">
        Send in-app notifications to all players or one user. Players see them in the bell + toast.
      </p>
      <div className="rounded-2xl border border-emerald-800 bg-surface-900 p-4 space-y-3">
        <Input placeholder="Title (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <Input placeholder="Title (BN)" value={titleBn} onChange={(e) => setTitleBn(e.target.value)} />
        <Input placeholder="Body (EN)" value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
        <Input placeholder="Body (BN)" value={bodyBn} onChange={(e) => setBodyBn(e.target.value)} />
        <Input placeholder="Optional userId (leave empty for broadcast)" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <div className="flex gap-2">
          <Button variant="gold" disabled={loading || !titleEn || !titleBn} onClick={() => send(true)}>
            Broadcast all
          </Button>
          <Button disabled={loading || !userId} onClick={() => send(false)}>
            Send to user
          </Button>
        </div>
      </div>
    </div>
  );
}
