"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

export default function LoginPage() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setLoading(false);
        return;
      }
      setUser(json.data);
      router.push("/");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-gold-500/30 bg-gradient-to-b from-emerald-900 to-emerald-950 p-6 shadow-2xl">
      <div className="mb-6 text-center">
        <div className="text-3xl font-black text-gold-400">TAKA69</div>
        <p className="mt-1 text-sm text-emerald-200/70">
          {t("Play-money social casino", "প্লে-মানি সোশ্যাল ক্যাসিনো")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          placeholder={t("Username", "ব্যবহারকারী নাম")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          type="password"
          placeholder={t("Password", "পাসওয়ার্ড")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
          {t("Login", "লগইন")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-emerald-100/70">
        {t("No account?", "অ্যাকাউন্ট নেই?")}{" "}
        <Link href="/register" className="font-semibold text-gold-300 underline">
          {t("Register", "নিবন্ধন")}
        </Link>
      </p>
      <p className="mt-4 text-center text-[10px] text-emerald-200/40">
        demo / demo1234 · {t("virtual coins only", "শুধু ভার্চুয়াল কয়েন")}
      </p>
    </div>
  );
}
