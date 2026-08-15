"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [login, setLogin] = useState("");
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
        body: JSON.stringify({ login: login.trim(), password }),
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
    <div className="min-h-screen bg-[#0d1f0d] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-2xl mb-3">
            <span className="text-3xl font-black text-emerald-950">T69</span>
          </div>
          <div className="text-2xl font-black text-amber-300">TAKA69</div>
          <p className="mt-1 text-sm text-emerald-200/50">{t("Welcome back!", "স্বাগতম!")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 text-center">
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder={t("Username / Email / Phone", "ইউজারনেম / ইমেইল / ফোন")}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/10 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input
              type={showPw ? "text" : "password"}
              placeholder={t("Password", "পাসওয়ার্ড")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 focus:bg-white/10 transition"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-3.5 text-white/30 hover:text-white/70">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-amber-300/70 hover:text-amber-300">
              {t("Forgot password?", "পাসওয়ার্ড ভুলে গেছেন?")}
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-sm font-black text-emerald-950 shadow-lg hover:opacity-90 transition disabled:opacity-60">
            {loading ? t("Logging in...", "লগইন হচ্ছে...") : t("Login", "লগইন")}
          </button>
        </form>

        <GoogleAuthButton mode="login" />


        <p className="mt-6 text-center text-sm text-emerald-100/50">
          {t("No account?", "অ্যাকাউন্ট নেই?")}{" "}
          <Link href="/register" className="font-bold text-amber-300 hover:text-amber-200">
            {t("Register Free", "ফ্রি নিবন্ধন")}
          </Link>
        </p>
        <p className="mt-3 text-center text-[10px] text-emerald-200/25">
          {t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK · বাস্তব অর্থ নয়")}
        </p>
      </div>
    </div>
  );
}
