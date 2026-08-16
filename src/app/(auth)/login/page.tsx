"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import { useBrand } from "@/hooks/useBrand";

export default function LoginPage() {
  const t = useLang((s) => s.t);
  const brand = useBrand();
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
    <main className="min-h-screen overflow-hidden bg-[#fff8f4] text-slate-900">
      <section className="relative overflow-hidden rounded-b-[2.75rem] bg-gradient-to-br from-[#ff8550] via-[#ff6250] to-[#ef405d] px-5 pb-24 pt-8 text-white shadow-[0_18px_45px_rgba(239,64,93,0.22)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#ffb24d]/25" />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-[1.35rem] bg-white/20 p-1.5 shadow-lg ring-1 ring-white/35 backdrop-blur-sm">
                <Image
                  src={brand.logoUrl || "/icons/logo.png"}
                  alt={brand.siteName || "TAKA69"}
                  fill
                  className="rounded-[1rem] object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">{t("Play. Win. Enjoy.", "খেলুন · জিতুন · উপভোগ করুন")}</p>
                <p className="mt-0.5 text-2xl font-black tracking-tight">{brand.siteName || "TAKA69"}</p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm" aria-hidden="true">
              <Sparkles className="h-5 w-5 text-[#ffe2a8]" />
            </div>
          </div>

          <div className="mt-8 max-w-[18rem]">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              <UserRound className="h-3.5 w-3.5" />
              {t("Member access", "সদস্য প্রবেশ")}
            </p>
            <h1 className="text-[2rem] font-black leading-[1.08] tracking-tight">
              {t("Welcome back!", "আবারও স্বাগতম!")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {t("Continue your gaming journey with TAKA69.", "TAKA69-এর সাথে আপনার গেমিং যাত্রা চালিয়ে যান।")}
            </p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-14 w-full max-w-sm px-4 pb-8">
        <form onSubmit={onSubmit} className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(80,39,22,0.12)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900">{t("Sign in", "লগইন করুন")}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t("Enter your details to access your account.", "আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।")}
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="login" className="mb-2 block text-sm font-bold text-slate-800">
                {t("Username / Email / Phone", "ইউজারনেম / ইমেইল / ফোন")}
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#f2634f]" aria-hidden="true" />
                <input
                  id="login"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  placeholder={t("Enter username, email or phone", "ইউজারনেম, ইমেইল বা ফোন লিখুন")}
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                  aria-required="true"
                  className="w-full rounded-2xl border border-slate-200 bg-[#fffaf7] px-4 py-3.5 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#f2634f] focus:bg-white focus:ring-4 focus:ring-[#f2634f]/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-800">
                {t("Password", "পাসওয়ার্ড")}
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#f2634f]" aria-hidden="true" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("Enter your password", "আপনার পাসওয়ার্ড লিখুন")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  className="w-full rounded-2xl border border-slate-200 bg-[#fffaf7] px-4 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#f2634f] focus:bg-white focus:ring-4 focus:ring-[#f2634f]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? t("Hide password", "পাসওয়ার্ড লুকান") : t("Show password", "পাসওয়ার্ড দেখুন")}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#fff0eb] hover:text-[#f2634f] focus:outline-none focus:ring-2 focus:ring-[#f2634f]/30"
                >
                  {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-right">
            <Link href="/forgot-password" className="text-xs font-bold text-[#ed5a4c] underline-offset-4 transition hover:text-[#d9414d] hover:underline">
              {t("Forgot password?", "পাসওয়ার্ড ভুলে গেছেন?")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#ff784d] to-[#ef4d59] py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(239,77,89,0.25)] transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-[#ef4d59]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("Logging in...", "লগইন হচ্ছে...") : t("Login to account", "অ্যাকাউন্টে লগইন করুন")}
          </button>
        </form>

        <div className="mt-4 rounded-[1.75rem] bg-gradient-to-br from-[#ff744f] to-[#f04d5a] p-4 shadow-[0_12px_30px_rgba(239,77,89,0.18)]">
          <GoogleAuthButton mode="login" />
        </div>

        <div className="mt-4 rounded-[1.75rem] border border-[#f8ded4] bg-[#fffdfb] px-5 py-4 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            {t("No account yet?", "এখনও অ্যাকাউন্ট নেই?")} {" "}
            <Link href="/register" className="font-black text-[#ed5a4c] transition hover:text-[#d9414d]">
              {t("Register free", "ফ্রি নিবন্ধন করুন")}
            </Link>
          </p>
          <p className="mt-3 text-[10px] font-medium text-slate-400">
            {t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK · বাস্তব অর্থ নয়")}
          </p>
        </div>
      </div>
    </main>
  );
}
