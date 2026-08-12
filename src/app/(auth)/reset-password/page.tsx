"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

function ResetForm() {
  const t = useLang((s) => s.t);
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError(t("Invalid reset link", "অকার্যকর রিসেট লিঙ্ক"));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError(t("Password must be at least 6 characters", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর")); return; }
    if (password !== confirm) { setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না")); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "Failed"); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
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
        <p className="mt-1 text-sm text-emerald-200/60">{t("Set new password", "নতুন পাসওয়ার্ড সেট করুন")}</p>
      </div>

      {done ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="text-emerald-300 font-semibold">{t("Password updated!", "পাসওয়ার্ড আপডেট হয়েছে!")}</p>
          <p className="text-sm text-white/50">{t("Redirecting to login…", "লগইনে যাচ্ছে…")}</p>
        </div>
      ) : !token ? (
        <div className="text-center space-y-4 py-4">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
          <p className="text-rose-300">{t("Invalid or expired reset link.", "অকার্যকর বা মেয়াদোত্তীর্ণ রিসেট লিঙ্ক।")}</p>
          <Link href="/forgot-password"><Button className="w-full">{t("Request new link", "নতুন লিঙ্ক অনুরোধ করুন")}</Button></Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
            <Input type={showPw ? "text" : "password"} placeholder={t("New Password", "নতুন পাসওয়ার্ড")} value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9 pr-9" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-white/30 hover:text-white/70">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
            <Input type={showPw ? "text" : "password"} placeholder={t("Confirm New Password", "পাসওয়ার্ড নিশ্চিত করুন")} value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="pl-9" />
          </div>
          {error && <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3 text-base font-bold">
            {loading ? t("Updating…", "আপডেট হচ্ছে…") : t("Update Password", "পাসওয়ার্ড আপডেট করুন")}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
