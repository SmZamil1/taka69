"use client";

import { useState } from "react";
import { CreditCard, KeyRound, LogIn, LogOut, Mail, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { AccountCard, AccountHeader, AccountHero, AccountRow, FloatingAccountActions } from "@/components/account";

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const checks = [Boolean(user?.username), Boolean(user?.avatar), true];
  const score = checks.filter(Boolean).length === checks.length ? 85 : 60;

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-28 text-[#173251]">
    <AccountHeader title="নিরাপত্তা কেন্দ্র" subtitle="আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন" />
    <div className="mx-auto max-w-lg space-y-4 pt-4">
      <AccountHero username={user?.username} avatar={user?.avatar} badge="সুরক্ষিত" eyebrow="অ্যাকাউন্ট নিরাপত্তা" description="আপনার অ্যাকাউন্টের নিরাপত্তা অগ্রগতি" progress={score} progressLabel="নিরাপত্তা স্কোর" />
      <AccountCard title="অ্যাকাউন্ট ব্যবস্থাপনা" subtitle="প্রোফাইল ও লগইন সেটিংস" icon={<ShieldCheck className="h-4 w-4" />}>
        <AccountRow icon={UserRound} title="প্রোফাইল তথ্য" description="নাম, ফোন ও ব্যক্তিগত তথ্য" href="/profile/settings" />
        <AccountRow icon={Mail} title="ইমেইল / ফোন যাচাই" description="অ্যাকাউন্ট রিকভারি তথ্য" value="পর্যালোচনা" disabled />
        <AccountRow icon={KeyRound} title="পাসওয়ার্ড পরিবর্তন" description="নিয়মিত পাসওয়ার্ড আপডেট করুন" href="/profile/settings" />
      </AccountCard>
      <AccountCard title="পেমেন্ট ও কার্যকলাপ" subtitle="অ্যাকাউন্টে কী ঘটছে তা দেখুন" icon={<CreditCard className="h-4 w-4" />}>
        <AccountRow icon={Smartphone} title="ই-ওয়ালেট" description="পেমেন্ট পদ্ধতি ও উত্তোলন" href="/wallet?tab=cards" />
        <AccountRow icon={LogIn} title="লগইন কার্যকলাপ" description="সাম্প্রতিক লগইন তথ্য" value="শীঘ্রই" disabled />
        <AccountRow icon={CreditCard} title="লেনদেনের নিরাপত্তা" description="ডিপোজিট ও উত্তোলন রেকর্ড" href="/wallet?tab=history" />
      </AccountCard>
      <AccountCard className="border-rose-100" title="সেশন" icon={<LogOut className="h-4 w-4" />}>
        <AccountRow icon={LogOut} title={loggingOut ? "লগ আউট হচ্ছে..." : "লগ আউট"} description="এই ডিভাইস থেকে নিরাপদে বের হয়ে যান" onClick={logout} disabled={loggingOut} />
      </AccountCard>
    </div>
    <FloatingAccountActions />
  </div>;
}
