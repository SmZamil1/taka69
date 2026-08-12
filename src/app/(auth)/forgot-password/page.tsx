"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const t = useLang((s) => s.t);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Failed"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-900/80 to-black/90 p-6 shadow-2xl backdrop-blur">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-3">
          <span className="text-2xl font-black text-emerald-950">T69</span>
        </div>
        <div className="text-2xl font-black text-amber-300">TAKA69</div>
        <p className="mt-1 text-sm text-emerald-200/60">{t("Reset your password", "পাসওয়ার্ড রিসেট করুন")}</p>
      </div>

      {sent ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="text-emerald-300 font-semibold">{t("Reset link sent!", "রিসেট লিঙ্ক পাঠানো হয়েছে!")}</p>
          <p className="text-sm text-white/50">{t("Check your email for the reset link. It expires in 1 hour.", "রিসেট লিঙ্কের জন্য ইমেইল চেক করুন। ১ ঘণ্টার মধ্যে মেয়াদ শেষ।")}</p>
          <Link href="/login" className="block">
            <Button className="w-full">{t("Back to Login", "লগইনে ফিরুন")}</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-white/50 text-center">{t("Enter your registered email to receive a password reset link.", "পাসওয়ার্ড রিসেট লিঙ্ক পেতে আপনার নিবন্ধিত ইমেইল দিন।")}</p>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
            <Input type="email" placeholder={t("Email address", "ইমেইল ঠিকানা")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="pl-9" />
          </div>
          {error && <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3 text-base font-bold">
            {loading ? t("Sending…", "পাঠানো হচ্ছে…") : t("Send Reset Link", "রিসেট লিঙ্ক পাঠান")}
          </Button>
          <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-white/40 hover:text-white/70">
            <ArrowLeft className="h-3.5 w-3.5" />{t("Back to login", "লগইনে ফিরুন")}
          </Link>
        </form>
      )}
    </div>
  );
}
