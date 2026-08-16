"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";
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
    <div className="rounded-[2rem] border border-rose-200 bg-white p-6 text-center shadow-[0_18px_45px_rgba(16,43,87,0.12)]">
      <p className="text-rose-700">{t("Invalid reset link", "অবৈধ রিসেট লিংক")}</p>
      <Link href="/forgot-password" className="mt-2 block text-sm font-bold text-[#496f9b] hover:text-[#102b57]">{t("Request new link", "নতুন লিংক চাইুন")}</Link>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102b57] shadow-[0_12px_30px_rgba(16,43,87,0.22)] ring-2 ring-[#e8bd58]/55">
          <ShieldCheck className="h-8 w-8 text-[#f4d27a]" aria-hidden="true" />
        </div>
        <div className="text-xl font-black text-[#102b57]">{t("New Password", "নতুন পাসওয়ার্ড")}</div>
      </div>

      {done ? (
        <div className="rounded-[2rem] border border-[#b9decf] bg-white p-6 text-center shadow-[0_18px_45px_rgba(16,43,87,0.12)]">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#4f8a72]" aria-hidden="true" />
          <div className="mt-3 font-bold text-[#356b58]">{t("Password changed!", "পাসওয়ার্ড পরিবর্তিত!")}</div>
          <p className="mt-1 text-sm text-[#7891a8]">{t("Redirecting to login...", "লগইনে যাচ্ছেন...")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 rounded-[2rem] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(16,43,87,0.14)] sm:p-6">
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">{error}</div>}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("New password", "নতুন পাসওয়ার্ড")} type={showPw ? "text" : "password"} placeholder={t("New password", "নতুন পাসওয়ার্ড")}
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 pr-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? t("Hide password", "পাসওয়ার্ড লুকান") : t("Show password", "পাসওয়ার্ড দেখুন")}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ba0b3] hover:bg-[#eef5fb] hover:text-[#102b57] focus:outline-none focus:ring-2 focus:ring-[#638bb5]/30">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} type={showPw ? "text" : "password"} placeholder={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")}
              value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-[#102b57] py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,43,87,0.22)] transition hover:bg-[#173b73] focus:outline-none focus:ring-4 focus:ring-[#638bb5]/30 disabled:opacity-60">
            {loading ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Set New Password", "নতুন পাসওয়ার্ড সেট করুন")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef5fb] px-4 py-8">
      <Suspense fallback={<div className="h-20 w-full" />}><ResetForm /></Suspense>
    </main>
  );
}
