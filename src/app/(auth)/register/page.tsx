"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Gift, LockKeyhole, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useBrand } from "@/hooks/useBrand";
import { cn } from "@/lib/utils";

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
    if (ref) setForm((current) => ({ ...current, referralCode: ref.toUpperCase() }));
  }, [sp]);

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (form.password !== form.confirm) {
      setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("Min 6 characters", "কমপক্ষে ৬ অক্ষর"));
      return;
    }
    if (!phone) {
      setError(t("Phone number is required", "ফোন নম্বর আবশ্যক"));
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("Enter a valid email", "সঠিক ইমেইল লিখুন"));
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      setError(t("Enter valid BD phone: 01XXXXXXXXX", "সঠিক বাংলাদেশি ফোন: 01XXXXXXXXX"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          email: email || undefined,
          phone,
          referralCode: form.referralCode.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setLoading(false);
        return;
      }
      setUser(json.data);
      const next = sp.get("next");
      if (json.data.needsOnboarding) {
        router.push(next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");
      } else {
        router.push(next || "/");
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 8 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;
  const strengthColor = ["", "bg-rose-500", "bg-[#e8bd58]", "bg-[#d7aa3f]", "bg-[#4f8a72]"][pwStrength];

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef5fb] text-[#173251]">
      <section className="relative overflow-hidden rounded-b-[2.75rem] bg-[#102b57] px-5 pb-24 pt-8 text-white shadow-[0_18px_45px_rgba(16,43,87,0.24)] sm:px-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#6ea6dc]/20" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#e8bd58]/20" />
        <div className="relative mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.35rem] bg-white/15 p-1.5 shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
                <Image src={brand.logoUrl || "/icons/logo.png"} alt={brand.siteName || "TAKA69"} fill className="rounded-[1rem] object-cover" priority />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d8e8f7]/75">{t("Play. Win. Enjoy.", "খেলুন · জিতুন · উপভোগ করুন")}</p>
                <p className="mt-0.5 truncate text-2xl font-black tracking-tight">{brand.siteName || "TAKA69"}</p>
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm" aria-hidden="true">
              <Sparkles className="h-5 w-5 text-[#f4d27a]" />
            </div>
          </div>
          <div className="mt-8 max-w-[19rem]">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#e6f1fb] backdrop-blur-sm">
              <UserRound className="h-3.5 w-3.5" />
              {t("New member", "নতুন সদস্য")}
            </p>
            <h1 className="text-[2rem] font-black leading-[1.08] tracking-tight">{t("Join the fun!", "মজায় যোগ দিন!")}</h1>
            <p className="mt-2 text-sm leading-6 text-[#d8e8f7]/80">{t("Create your TAKA69 account and start your gaming journey.", "আপনার TAKA69 অ্যাকাউন্ট তৈরি করে গেমিং যাত্রা শুরু করুন।")}</p>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-14 w-full max-w-sm px-4 pb-8 sm:px-0">
        <form onSubmit={onSubmit} className="rounded-[2rem] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(16,43,87,0.14)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-[#173251]">{t("Create account", "অ্যাকাউন্ট তৈরি করুন")}</h2>
            <p className="mt-1 text-xs leading-5 text-[#7891a8]">{t("Fill in your details to get started.", "শুরু করতে আপনার তথ্য পূরণ করুন।")}</p>
          </div>
          {error && <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">{error}</div>}

          <div className="space-y-3">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Username", "ইউজারনেম")} autoComplete="username" placeholder={t("Username", "ইউজারনেম")} value={form.username} onChange={(e) => setField("username", e.target.value)} required minLength={3} maxLength={20} className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Phone number", "ফোন নম্বর")} type="tel" inputMode="numeric" autoComplete="tel" placeholder={t("Phone 01XXXXXXXXX", "ফোন 01XXXXXXXXX")} value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            </div>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Email optional", "ইমেইল ঐচ্ছিক")} type="email" autoComplete="email" placeholder={t("Email (optional)", "ইমেইল (ঐচ্ছিক)")} value={form.email} onChange={(e) => setField("email", e.target.value)} className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Password", "পাসওয়ার্ড")} type={showPw ? "text" : "password"} autoComplete="new-password" placeholder={t("Password (min 6)", "পাসওয়ার্ড (কমপক্ষে ৬)")} value={form.password} onChange={(e) => setField("password", e.target.value)} required minLength={6} className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 pr-12 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
              <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? t("Hide password", "পাসওয়ার্ড লুকান") : t("Show password", "পাসওয়ার্ড দেখুন")} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ba0b3] transition hover:bg-[#eef5fb] hover:text-[#102b57] focus:outline-none focus:ring-2 focus:ring-[#638bb5]/30">
                {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {form.password.length > 0 && <div className="flex gap-1" aria-label={t("Password strength", "পাসওয়ার্ডের শক্তি")}>{[1, 2, 3, 4].map((i) => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= pwStrength ? strengthColor : "bg-[#dce8f2]")} />)}</div>}
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} type={showPw ? "text" : "password"} autoComplete="new-password" placeholder={t("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} value={form.confirm} onChange={(e) => setField("confirm", e.target.value)} required className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            </div>
            <div className="relative">
              <Gift className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#638bb5]" aria-hidden="true" />
              <input aria-label={t("Referral code optional", "রেফারেল কোড ঐচ্ছিক")} placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")} value={form.referralCode} onChange={(e) => setField("referralCode", e.target.value.toUpperCase())} className="w-full rounded-2xl border border-[#d6e3ef] bg-[#f7fafd] px-4 py-3.5 pl-11 text-sm text-[#173251] outline-none transition placeholder:text-[#9aafc2] focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full rounded-2xl bg-[#102b57] py-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,43,87,0.22)] transition hover:bg-[#173b73] focus:outline-none focus:ring-4 focus:ring-[#638bb5]/30 disabled:cursor-not-allowed disabled:opacity-60">{loading ? t("Creating...", "তৈরি হচ্ছে...") : t("Create account", "অ্যাকাউন্ট তৈরি করুন")}</button>
        </form>

        <div className="mt-4 rounded-[1.75rem] border border-[#d6e3ef] bg-[#f8fbfe] p-4 shadow-sm"><GoogleAuthButton mode="register" /></div>
        <div className="mt-4 rounded-[1.75rem] border border-[#d6e3ef] bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-sm text-[#7891a8]">{t("Already registered?", "ইতিমধ্যে নিবন্ধিত?")} {" "}<Link href="/login" className="font-black text-[#496f9b] transition hover:text-[#102b57]">{t("Login", "লগইন")}</Link></p>
          <p className="mt-3 text-[10px] font-medium text-[#9aafc2]">{t("18+ · Virtual TK only · No real money", "১৮+ · শুধু ভার্চুয়াল TK · বাস্তব অর্থ নয়")}</p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#eef5fb]" />}><RegisterForm /></Suspense>;
}
