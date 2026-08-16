"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const t = useLang((s) => s.t);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (json.ok) setSent(true);
      else setError(json.error || "Failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#eef5fb] px-4 py-8 text-[#173251] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102b57] shadow-[0_12px_30px_rgba(16,43,87,0.22)] ring-2 ring-[#e8bd58]/55">
              <ShieldCheck className="h-8 w-8 text-[#f4d27a]" aria-hidden="true" />
            </div>
            <div className="text-xl font-black text-[#102b57]">{t("Forgot Password", "পাসওয়ার্ড ভুলে গেছেন")}</div>
            <p className="mt-1 text-sm text-[#7891a8]">{t("Enter your email to get a reset link", "রিসেট লিংক পেতে ইমেইল দিন")}</p>
          </div>

          {sent ? (
            <div className="rounded-[2rem] border border-[#b9decf] bg-white p-6 text-center shadow-[0_18px_45px_rgba(16,43,87,0.12)]">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#4f8a72]" aria-hidden="true" />
              <div className="mt-3 font-bold text-[#356b58]">{t("Email sent!", "ইমেইল পাঠানো হয়েছে!")}</div>
              <p className="mt-2 text-sm leading-6 text-[#7891a8]">{t("Check your inbox for the reset link. It expires in 1 hour.", "রিসেট লিংকের জন্য আপনার ইনবক্স চেক করুন। ১ ঘণ্টায় মেয়াদ শেষ।")}</p>
              <Link href="/login" className="mt-4 block text-sm font-bold text-[#496f9b] hover:text-[#102b57]">← {t("Back to Login", "লগইনে ফিরুন")}</Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3 rounded-[2rem] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(16,43,87,0.14)] sm:p-6">
              {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">{error}</div>}
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
                <input aria-label={t("Email address", "ইমেইল ঠিকানা")} type="email" placeholder={t("Your email address", "আপনার ইমেইল")} value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-[#102b57] py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,43,87,0.22)] transition hover:bg-[#173b73] focus:outline-none focus:ring-4 focus:ring-[#638bb5]/30 disabled:opacity-60">
                {loading ? t("Sending...", "পাঠানো হচ্ছে...") : t("Send Reset Link", "রিসেট লিংক পাঠান")}
              </button>
              <Link href="/login" className="mt-2 flex items-center justify-center gap-1 text-sm text-[#7891a8] hover:text-[#102b57]">
                <ArrowLeft className="h-4 w-4" /> {t("Back to Login", "লগইনে ফিরুন")}
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
