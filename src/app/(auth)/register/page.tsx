"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Eye, EyeOff, Lock, User, Phone, Mail, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

function RegisterForm() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", confirm: "", referralCode: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = sp.get("ref") || sp.get("referral") || "";
    if (ref) setForm(f => ({ ...f, referralCode: ref.toUpperCase() }));
  }, [sp]);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না")); return; }
    if (form.password.length < 6) { setError(t("Min 6 characters", "কমপক্ষে ৬ অক্ষর")); return; }
    if (!form.email.trim() && !form.phone.trim()) {
      setError(t("Email or phone is required", "ইমেইল অথবা ফোন নম্বর দিতে হবে"));
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t("Enter a valid email", "সঠিক ইমেইল লিখুন"));
      return;
    }
    if (form.phone.trim() && !/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      setError(t("Enter valid BD phone: 01XXXXXXXXX", "সঠিক বাংলাদেশি ফোন: 01XXXXXXXXX"));
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          referralCode: form.referralCode.trim() || undefined,
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

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 8 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;
  const strengthColor = ["","bg-rose-500","bg-amber-400","bg-yellow-400","bg-emerald-400"][pwStrength];

  return (
    <div className="min-h-screen bg-[#0d1f0d] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-2xl mb-2">
            <span className="text-2xl font-black text-emerald-950">T69</span>
          </div>
          <div className="text-2xl font-black text-amber-300">TAKA69</div>
          <p className="mt-1 text-sm text-emerald-200/50">{t("Create your account", "অ্যাকাউন্ট তৈরি করুন")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-2.5">
          {error && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 text-center">{error}</div>
          )}

          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input placeholder={t("* Username", "* ইউজারনেম")} value={form.username}
              onChange={e => f("username", e.target.value)} required minLength={3} maxLength={20}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type="tel" placeholder={t("Phone 01XXXXXXXXX (optional)", "ফোন 01XXXXXXXXX (ঐচ্ছিক)")}
              value={form.phone} onChange={e => f("phone", e.target.value)}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type="email" placeholder={t("Email (for password reset)", "ইমেইল (পাসওয়ার্ড রিসেটের জন্য)")}
              value={form.email} onChange={e => f("email", e.target.value)}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type={showPw ? "text" : "password"} placeholder={t("* Password (min 6)", "* পাসওয়ার্ড (কমপক্ষে ৬)")}
              value={form.password} onChange={e => f("password", e.target.value)} required minLength={6}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-3.5 text-white/30 hover:text-white/70">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {form.password.length > 0 && (
            <div className="flex gap-1">
              {[1,2,3,4].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= pwStrength ? strengthColor : "bg-white/10")} />)}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input type={showPw ? "text" : "password"} placeholder={t("* Confirm password", "* পাসওয়ার্ড নিশ্চিত করুন")}
              value={form.confirm} onChange={e => f("confirm", e.target.value)} required
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>

          <div className="relative">
            <Gift className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")}
              value={form.referralCode} onChange={e => f("referralCode", e.target.value.toUpperCase())}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3.5 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-4 text-sm font-black text-emerald-950 shadow-lg hover:opacity-90 transition disabled:opacity-60 mt-2">
            {loading ? t("Creating...", "তৈরি হচ্ছে...") : t("Create Account", "অ্যাকাউন্ট তৈরি করুন")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-emerald-100/50">
          {t("Already registered?", "ইতিমধ্যে নিবন্ধিত?")}{" "}
          <Link href="/login" className="font-bold text-amber-300">{t("Login", "লগইন")}</Link>
        </p>
        <p className="mt-2 text-center text-[10px] text-emerald-200/25">
          {t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK")}
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="h-screen bg-[#0d1f0d]" />}><RegisterForm /></Suspense>;
}
