"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, Lock, User, Gift } from "lucide-react";

function RegisterForm() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = sp.get("ref") || sp.get("referral") || "";
    if (ref) setReferralCode(ref.toUpperCase());
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না")); return; }
    if (password.length < 6) { setError(t("Password must be at least 6 characters", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর")); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password, referralCode: referralCode.trim() || undefined }),
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

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 8 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthColor = ["", "bg-rose-500", "bg-amber-400", "bg-yellow-400", "bg-emerald-400"][pwStrength];
  const strengthLabel = ["", t("Weak","দুর্বল"), t("Fair","মোটামুটি"), t("Good","ভালো"), t("Strong","শক্তিশালী")][pwStrength];

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-emerald-900/80 to-black/90 p-6 shadow-2xl backdrop-blur">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-3">
          <span className="text-2xl font-black text-emerald-950">T69</span>
        </div>
        <div className="text-2xl font-black text-amber-300">TAKA69</div>
        <p className="mt-1 text-sm text-emerald-200/60">{t("Create your free account", "ফ্রি অ্যাকাউন্ট তৈরি করুন")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input placeholder={t("* Username (3-20 chars)", "* ইউজারনেম (৩-২০ অক্ষর)")}
            value={username} onChange={(e) => setUsername(e.target.value)}
            required minLength={3} maxLength={20} className="pl-9" />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input type={showPw ? "text" : "password"} placeholder={t("* Password (min 6)", "* পাসওয়ার্ড (কমপক্ষে ৬)")}
            value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6} className="pl-9 pr-9" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-white/30 hover:text-white/60">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password strength */}
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColor : "bg-white/10"}`} />
              ))}
            </div>
            <div className="text-[10px] text-white/40">{strengthLabel}</div>
          </div>
        )}

        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input type={showPw ? "text" : "password"} placeholder={t("* Confirm password", "* পাসওয়ার্ড নিশ্চিত করুন")}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="pl-9" />
        </div>

        <div className="relative">
          <Gift className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")}
            value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="pl-9" />
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-400">{error}</div>
        )}

        <Button type="submit" variant="gold" size="lg" className="w-full font-black tracking-wide" disabled={loading}>
          {loading ? t("Creating...", "তৈরি হচ্ছে...") : t("Create Account", "অ্যাকাউন্ট তৈরি করুন")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-emerald-100/60">
        {t("Already have an account?", "ইতিমধ্যে অ্যাকাউন্ট আছে?")}{" "}
        <Link href="/login" className="font-bold text-amber-300 hover:text-amber-200 underline">
          {t("Login", "লগইন")}
        </Link>
      </p>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-emerald-200/30">
        {t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK · কোনো বাস্তব অর্থ নয়")}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-emerald-200/60">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
