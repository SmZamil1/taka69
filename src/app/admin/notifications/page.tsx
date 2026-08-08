"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { BellRing, Image as ImageIcon, Link2, Send } from "lucide-react";

export default function AdminNotificationsPage() {
  const toast = useToast();
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyBn, setBodyBn] = useState("");
  const [href, setHref] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(global = true) {
    if (!titleEn.trim() || !titleBn.trim() || !bodyEn.trim() || !bodyBn.trim()) {
      toast.error("Fill EN + BN title and body");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          titleEn,
          titleBn,
          bodyEn,
          bodyBn,
          href: href || undefined,
          imageUrl: imageUrl || undefined,
          global,
          userId: userId || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error("Failed", json.error);
        setLoading(false);
        return;
      }
      toast.success(global ? "Broadcast sent" : "User notified", "Players get in-app + browser push");
      setTitleEn("");
      setTitleBn("");
      setBodyEn("");
      setBodyBn("");
      setHref("");
      setImageUrl("");
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-amber-300">Push Notifications</h1>
        <p className="mt-1 text-xs text-white/50">
          Instant broadcast. Players see the bell toast and browser notification even if the tab is in background
          (after they allow notifications once). Optional deep-link URL + image.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
          <BellRing className="h-3.5 w-3.5" /> Message
        </div>
        <Input placeholder="Title (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <Input placeholder="Title (BN)" value={titleBn} onChange={(e) => setTitleBn(e.target.value)} />
        <Input placeholder="Body (EN)" value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
        <Input placeholder="Body (BN)" value={bodyBn} onChange={(e) => setBodyBn(e.target.value)} />

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 pt-1">
          <Link2 className="h-3.5 w-3.5" /> Optional link
        </div>
        <Input
          placeholder="URL e.g. /promotions or https://..."
          value={href}
          onChange={(e) => setHref(e.target.value)}
        />

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 pt-1">
          <ImageIcon className="h-3.5 w-3.5" /> Optional image
        </div>
        <Input
          placeholder="Image URL https://... or /banners/welcome.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-28 w-full rounded-xl object-cover border border-white/10" />
        )}

        <Input
          placeholder="Optional userId (empty = everyone)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="gold"
            className="gap-2"
            disabled={loading || !titleEn || !titleBn}
            onClick={() => send(true)}
          >
            <Send className="h-4 w-4" />
            Broadcast all
          </Button>
          <Button disabled={loading || !userId} onClick={() => send(false)} className="gap-2">
            Send to user
          </Button>
        </div>
      </div>
    </div>
  );
}
