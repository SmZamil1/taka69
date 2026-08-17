"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { User, Phone, UserRoundCheck } from "lucide-react";

function OnboardingForm() {
  const t = useLang((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
      setError(t("Enter valid BD phone: 01XXXXXXXXX", "সঠিক বাংলাদেশি ফোন: 01XXXXXXXXX"));
      return;
    }
    if (username.trim().length < 3) {
      setError(t("Username min 3 chars", "ইউজারনেম কমপক্ষে ৩ অক্ষর"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setLoading(false);
        return;
      }
      setUser({
        id: json.data.id,
        username: json.data.username,
        role: json.data.role,
        balance: json.data.balance,
        vipLevel: json.data.vipLevel,
        avatar: json.data.avatar,
      });
      router.replace(sp.get("next") || "/");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef5fb] px-4 py-8 text-[#173251] sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#102b57] shadow-[0_12px_30px_rgba(16,43,87,0.22)] ring-2 ring-[#e8bd58]/55">
              <UserRoundCheck className="h-8 w-8 text-[#f4d27a]" aria-hidden="true" />
            </div>
            <div className="mt-3 text-2xl font-black text-[#102b57]">TAKA69</div>
            <p className="mt-2 text-sm text-[#496f9b]">
              {t("Complete your profile", "প্রোফাইল সম্পূর্ণ করুন")}
            </p>
            <p className="mt-1 text-xs text-[#7891a8]">
              {t("Username and phone are required", "ইউজারনেম ও ফোন নম্বর আবশ্যক")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3 rounded-[2rem] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(16,43,87,0.14)] sm:p-6">
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
                {error}
              </div>
            )}
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
              <input
                aria-label={t("Username", "ইউজারনেম")}
                className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] py-3.5 pl-11 pr-3 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15"
                placeholder={t("* Username", "* ইউজারনেম")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#638bb5]" aria-hidden="true" />
              <input
                aria-label={t("Phone number", "ফোন নম্বর")}
                className="w-full rounded-xl border border-[#d6e3ef] bg-[#f7fafd] py-3.5 pl-11 pr-3 text-sm text-[#173251] placeholder:text-[#9aafc2] outline-none transition focus:border-[#638bb5] focus:bg-white focus:ring-4 focus:ring-[#638bb5]/15"
                placeholder={t("* Phone 01XXXXXXXXX", "* ফোন 01XXXXXXXXX")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="numeric"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#102b57] py-3.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,43,87,0.22)] transition hover:bg-[#173b73] focus:outline-none focus:ring-4 focus:ring-[#638bb5]/30 disabled:opacity-50"
            >
              {loading ? "..." : t("Continue", "চালিয়ে যান")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eef5fb] p-8 text-center text-[#7891a8]">Loading…</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
