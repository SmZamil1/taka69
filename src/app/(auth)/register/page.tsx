"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Eye, EyeOff, Lock, User, Phone, Mail, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useBrand } from "@/hooks/useBrand";

function RegisterForm() {
  const t = useLang((s) => s.t);
  const brand = useBrand();
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
    if (!form.email.trim()) {
      setError(t("Email is required", "ইমেইল আবশ্যক"));
      return;
    }
    if (!form.phone.trim()) {
      setError(t("Phone number is required", "ফোন নম্বর আবশ্যক"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t("Enter a valid email", "সঠিক ইমেইল লিখুন"));
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
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
          email: form.email.trim(),
          phone: form.phone.trim(),
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
  const strengthColor = ["", "bg-rose-500", "bg-[#e8bd58]", "bg-[#d7aa3f]", "bg-[#4f8a72]"][pwStrength];

  return (
    <main className="min-h-screen bg-[#eef5fb] px-4 py-8 text-[#173251] sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl bg-[#102b57] p-1.5 shadow-[0_12px_30px_rgba(16,43,87,0.22)] ring-2 ring-[#e8bd58]/55">
            <Image
              src={brand.logoUrl || "/icons/logo.png"}
              alt={brand.siteName || "TAKA69"}
              fill
              className="rounded-[0.85rem] object-cover"
              priority
            />
          </div>
          <div className="text-2xl font-black text-[#102b57]">{brand.siteName || "TAKA69"}</div>
          <p className="mt-1 text-sm text-[#7891a8]">{t("Create your account", "অ্যাকাউন্ট তৈরি করুন")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-2.5 rounded-[2rem] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(16,43,87,0.14)] sm:p-6">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">{error}</div>
          )}

          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Username", "ইউজারনেম")} placeholder={t("* Username", "* ইউজারনেম")} value={form.username}
              onChange={e => f("username", e.target.value)} required minLength={3} maxLength={20}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>

          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Phone number", "ফোন নম্বর")} type="tel" inputMode="numeric" placeholder={t("* Phone 01XXXXXXXXX", "* ফোন 01XXXXXXXXX")}
              value={form.phone} onChange={e => f("phone", e.target.value)}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Email", "ইমেইল")} type="email" placeholder={t("* Email", "* ইমেইল")}
              value={form.email} onChange={e => f("email", e.target.value)}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Password", "পাসওয়ার্ড")} type={showPw ? "text" : "password"} placeholder={t("* Password (min 6)", "* পাসওয়ার্ড (কমপক্ষে ৬)")}
              value={form.password} onChange={e => f("password", e.target.value)} required minLength={6}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 pr-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? t("Hide password", "পাসওয়ার্ড লুকান") : t("Show password", "পাসওয়ার্ড দেখুন")}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ba0b3] hover:bg-[#eef5fb] hover:text-[#102b57] focus:outline-none focus:ring-2 focus:ring-[#638bb5]/30">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {form.password.length > 0 && (
            <div className="flex gap-1" aria-label={t("Password strength", "পাসওয়ার্ডের শক্তি")}>
              {[1, 2, 3, 4].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= pwStrength ? strengthColor : "bg-[#dce8f2]")} />)}
            </div>
          )}

          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} type={showPw ? "text" : "password"} placeholder={t("* Confirm password", "* পাসওয়ার্ড নিশ্চিত করুন")}
              value={form.confirm} onChange={e => f("confirm", e.target.value)} required
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>

          <div className="relative">
            <Gift className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
            <input aria-label={t("Referral code optional", "রেফারেল কোড ঐচ্ছিক")} placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")}
              value={form.referralCode} onChange={e => f("referralCode", e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-10 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
          </div>

          <button type="submit" disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#102b57] py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,43,87,0.22)] transition hover:bg-[#173b73] focus:outline-none focus:ring-4 focus:ring-[#638bb5]/30 disabled:opacity-60">
            {loading ? t("Creating...", "তৈরি হচ্ছে...") : t("Create Account", "অ্যাকাউন্ট তৈরি করুন")}
          </button>
        </form>

        <div className="mt-4 rounded-[1.75rem] border border-[#d6e3ef] bg-[#f8fbfe] p-4 shadow-sm">
          <GoogleAuthButton mode="register" />
        </div>

        <p className="mt-4 text-center text-sm text-[#7891a8]">
          {t("Already registered?", "ইতিমধ্যে নিবন্ধিত?")} {" "}
          <Link href="/login" className="font-bold text-[#496f9b] hover:text-[#102b57]">{t("Login", "লগইন")}</Link>
        </p>
        <p className="mt-2 text-center text-[10px] text-[#9aafc2]">
          {t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK")}
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#eef5fb]" />}><RegisterForm /></Suspense>;
}
