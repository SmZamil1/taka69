"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Mail, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-[#0d1f0d] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-2xl mb-3">
            <span className="text-2xl font-black text-emerald-950">T69</span>
          </div>
          <div className="text-xl font-black text-white">{t("Forgot Password", "পাসওয়ার্ড ভুলে গেছেন")}</div>
          <p className="mt-1 text-sm text-emerald-200/50">{t("Enter your email to get a reset link", "রিসেট লিংক পেতে ইমেইল দিন")}</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
            <div className="text-3xl">📧</div>
            <div className="font-bold text-emerald-300">{t("Email sent!", "ইমেইল পাঠানো হয়েছে!")}</div>
            <p className="text-sm text-white/60">{t("Check your inbox for the reset link. It expires in 1 hour.", "রিসেট লিংকের জন্য আপনার ইনবক্স চেক করুন। ১ ঘণ্টায় মেয়াদ শেষ।")}</p>
            <Link href="/login" className="block mt-4 text-amber-300 text-sm font-bold">← {t("Back to Login", "লগইনে ফিরুন")}</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {error && <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 text-center">{error}</div>}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
              <input type="email" placeholder={t("Your email address", "আপনার ইমেইল")} value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-sm font-black text-emerald-950 shadow-lg hover:opacity-90 transition disabled:opacity-60">
              {loading ? t("Sending...", "পাঠানো হচ্ছে...") : t("Send Reset Link", "রিসেট লিংক পাঠান")}
            </button>
            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-white/50 hover:text-white mt-2">
              <ArrowLeft className="h-4 w-4" /> {t("Back to Login", "লগইনে ফিরুন")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
