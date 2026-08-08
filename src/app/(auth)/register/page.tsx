"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

function RegisterForm() {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = sp.get("ref") || sp.get("referral") || "";
    if (ref) setReferralCode(ref.toUpperCase());
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("Passwords do not match", "পাসওয়ার্ড মিলছে না"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, referralCode: referralCode || undefined }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed");
        setLoading(false);
        return;
      }
      setUser(json.data);
      router.push("/");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-gold-500/30 bg-gradient-to-b from-emerald-900 to-emerald-950 p-6 shadow-2xl">
      <div className="mb-6 text-center">
        <div className="text-3xl font-black text-gold-400">TAKA69</div>
        <p className="mt-1 text-sm text-emerald-200/70">
          {t("Create free play-money account", "ফ্রি প্লে-মানি অ্যাকাউন্ট")}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          placeholder={t("* Username", "* ব্যবহারকারী নাম")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
        />
        <Input
          type="password"
          placeholder={t("* Password", "* পাসওয়ার্ড")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Input
          type="password"
          placeholder={t("* Confirm password", "* পাসওয়ার্ড নিশ্চিত করুন")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Input
          placeholder={t("Referral code (optional)", "রেফারেল কোড (ঐচ্ছিক)")}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
          {t("Register", "নিবন্ধন")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-emerald-100/70">
        {t("Already have an account?", "ইতিমধ্যে অ্যাকাউন্ট আছে?")}{" "}
        <Link href="/login" className="font-semibold text-gold-300 underline">
          {t("Login", "লগইন")}
        </Link>
      </p>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-emerald-200/40">
        {t(
          "By registering you confirm you are 18+ and understand coins have no cash value. No signup bonus — deposit first.",
          "নিবন্ধন করে আপনি নিশ্চিত করছেন আপনি ১৮+ এবং কয়েনের নগদ মূল্য নেই। সাইনআপ বোনাস নেই — আগে ডিপোজিট করুন।"
        )}
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
