"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Failed"); setLoading(false); return; }
      setUser(json.data);
      router.push("/");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-900/80 to-black/90 p-6 shadow-2xl backdrop-blur">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-3">
          <span className="text-2xl font-black text-emerald-950">T69</span>
        </div>
        <div className="text-2xl font-black text-amber-300">TAKA69</div>
        <p className="mt-1 text-sm text-emerald-200/60">{t("Welcome back!", "স্বাগতম!")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder={t("Username / Email / Phone", "ব্যবহারকারী নাম / ইমেইল / ফোন")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="pl-9"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            type={showPw ? "text" : "password"}
            placeholder={t("Password", "পাসওয়ার্ড")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="pl-9 pr-9"
          />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-3 text-white/30 hover:text-white/70">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-amber-400/70 hover:text-amber-300">
            {t("Forgot password?", "পাসওয়ার্ড ভুলে গেছেন?")}
          </Link>
        </div>

        {error && <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full py-3 text-base font-bold">
          {loading ? t("Logging in…", "লগইন হচ্ছে…") : t("Login", "লগইন")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-white/40">
        {t("Don't have an account?", "অ্যাকাউন্ট নেই?")}{" "}
        <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold">{t("Register", "নিবন্ধন করুন")}</Link>
      </p>
    </div>
  );
}
