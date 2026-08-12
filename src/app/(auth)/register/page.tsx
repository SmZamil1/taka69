"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, Lock, User, Gift, Mail, Phone } from "lucide-react";

function RegisterForm() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [contactMode, setContactMode] = useState<"email" | "phone">("email");

  useEffect(() => {
    const ref = sp.get("ref") || sp.get("referral") || "";
    if (ref) setReferralCode(ref.toUpperCase());
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না")); return; }
    if (password.length < 6) { setError(t("Password must be at least 6 characters", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর")); return; }
    if (contactMode === "email" && !email) { setError(t("Email is required", "ইমেইল আবশ্যক")); return; }
    if (contactMode === "phone" && !phone) { setError(t("Phone number is required", "ফোন নম্বর আবশ্যক")); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
          email: contactMode === "email" ? email.trim() : "",
          phone: contactMode === "phone" ? phone.trim() : "",
          referralCode: referralCode.trim() || undefined,
        }),
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
        {/* Username */}
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input placeholder={t("Username", "ব্যবহারকারী নাম")} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className="pl-9" />
        </div>

        {/* Contact mode toggle */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setContactMode("email")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${contactMode === "email" ? "bg-emerald-600 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-white/50"}`}>
            <Mail className="inline h-3.5 w-3.5 mr-1" />{t("Email", "ইমেইল")}
          </button>
          <button type="button" onClick={() => setContactMode("phone")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${contactMode === "phone" ? "bg-emerald-600 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-white/50"}`}>
            <Phone className="inline h-3.5 w-3.5 mr-1" />{t("Phone", "ফোন")}
          </button>
        </div>

        {/* Email or Phone */}
        {contactMode === "email" ? (
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
            <Input type="email" placeholder={t("Email address", "ইমেইল ঠিকানা")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="pl-9" />
          </div>
        ) : (
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
            <Input type="tel" placeholder={t("Phone number (e.g. 01XXXXXXXXX)", "ফোন নম্বর (যেমন ০১XXXXXXXXX)")} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required className="pl-9" />
          </div>
        )}

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input type={showPw ? "text" : "password"} placeholder={t("Password", "পাসওয়ার্ড")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className="pl-9 pr-9" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-white/30 hover:text-white/70">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded ${i <= pwStrength ? strengthColor : "bg-white/10"}`} />)}
            </div>
            <p className="text-xs text-white/40">{strengthLabel}</p>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input type={showPw ? "text" : "password"} placeholder={t("Confirm Password", "পাসওয়ার্ড নিশ্চিত করুন")} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className="pl-9" />
        </div>

        {/* Referral */}
        <div className="relative">
          <Gift className="absolute left-3 top-3 h-4 w-4 text-white/30 pointer-events-none" />
          <Input placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")} value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="pl-9" />
        </div>

        {error && <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full py-3 text-base font-bold">
          {loading ? t("Creating account…", "অ্যাকাউন্ট তৈরি হচ্ছে…") : t("Create Account", "অ্যাকাউন্ট তৈরি করুন")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-white/40">
        {t("Already have an account?", "ইতিমধ্যে অ্যাকাউন্ট আছে?")}{" "}
        <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">{t("Login", "লগইন")}</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
