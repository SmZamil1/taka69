"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetForm() {
  const t = useLang((s) => s.t);
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না")); return; }
    if (password.length < 6) { setError(t("Min 6 characters", "কমপক্ষে ৬ অক্ষর")); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (json.ok) { setDone(true); setTimeout(() => router.push("/login"), 2000); }
      else setError(json.error || "Failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  if (!token) return (
    <div className="text-center">
      <p className="text-rose-400">{t("Invalid reset link", "অবৈধ রিসেট লিংক")}</p>
      <Link href="/forgot-password" className="text-amber-300 text-sm mt-2 block">{t("Request new link", "নতুন লিংক চাইুন")}</Link>
    </div>
  );

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-2xl mb-3">
          <span className="text-2xl font-black text-emerald-950">T69</span>
        </div>
        <div className="text-xl font-black text-white">{t("New Password", "নতুন পাসওয়ার্ড")}</div>
      </div>

      {done ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-bold text-emerald-300">{t("Password changed!", "পাসওয়ার্ড পরিবর্তিত!")}</div>
          <p className="text-sm text-white/50 mt-1">{t("Redirecting to login...", "লগইনে যাচ্ছেন...")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          {error && <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 text-center">{error}</div>}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type={showPw ? "text" : "password"} placeholder={t("New password", "নতুন পাসওয়ার্ড")}
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-3.5 text-white/30">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type={showPw ? "text" : "password"} placeholder={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")}
              value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-sm font-black text-emerald-950 disabled:opacity-60">
            {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Set New Password", "নতুন পাসওয়ার্ড সেট করুন")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d1f0d] flex items-center justify-center px-4">
      <Suspense fallback={<div className="h-20 w-full" />}><ResetForm /></Suspense>
    </div>
  );
}
