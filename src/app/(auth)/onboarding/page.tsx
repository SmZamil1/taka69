"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { User, Phone } from "lucide-react";

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
    <div className="min-h-screen bg-[#0d1f0d] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="text-2xl font-black text-amber-300">TAKA69</div>
          <p className="mt-2 text-sm text-emerald-100/70">
            {t("Complete your profile", "প্রোফাইল সম্পূর্ণ করুন")}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {t("Username and phone are required", "ইউজারনেম ও ফোন নম্বর আবশ্যক")}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-center text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-3 text-sm text-white outline-none focus:border-amber-400/40"
              placeholder={t("* Username", "* ইউজারনেম")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-3 text-sm text-white outline-none focus:border-amber-400/40"
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
            className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-500 py-3.5 text-sm font-black text-emerald-950 disabled:opacity-50"
          >
            {loading ? "..." : t("Continue", "চালিয়ে যান")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading…</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
