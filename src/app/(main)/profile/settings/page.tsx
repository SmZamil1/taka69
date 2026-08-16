"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatBdt } from "@/lib/utils";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";
import { Calendar, Copy, CreditCard, KeyRound, LogOut, Mail, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { AccountCard, AccountHeader, AccountHero, AccountRow, FloatingAccountActions } from "@/components/account";

type Profile = { username: string; email: string | null; phone: string | null; balance: number; vipLevel: number; totalDeposit: number; totalBet: number; totalWin: number; totalCommission: number; referralCode: string; createdAt?: string; role?: string; avatar?: string | null };

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile", { credentials: "include" }).then((r) => r.json()).then((j) => { if (j.ok) setP(j.data); }).catch(() => {});
  }, [user?.id]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    useAuthStore.getState().setUser(null);
    router.push("/login");
  }

  if (!user) return <div className="py-16 text-center text-[#7891a8]"><p className="mb-3">{t("Please login", "লগইন করুন")}</p><Link href="/login" className="font-black text-[#1f70c1]">{t("Login", "লগইন")}</Link></div>;

  const profile = p || { username: user.username, balance: user.balance, vipLevel: user.vipLevel, email: null, phone: null, totalDeposit: 0, totalBet: 0, totalWin: 0, totalCommission: 0, referralCode: user.username };
  const score = profile.email || profile.phone ? 85 : 66;
  return <div className="-mx-3 -mt-3 min-h-[calc(100vh-5rem)] bg-[#eef5fb] px-3 pb-28 text-[#173251]">
    <div className="mx-auto max-w-lg space-y-3">
      <AccountHeader title={t("Security center", "সুরক্ষা কেন্দ্র")} subtitle={t("Keep your account safe", "আপনার অ্যাকাউন্ট নিরাপদ রাখুন")} />
      <AccountHero username={profile.username} avatar={profile.avatar || user.avatar || DEFAULT_PROFILE_AVATAR} balance={formatBdt(profile.balance)} badge={`${score}%`} eyebrow={t("Account security", "অ্যাকাউন্ট নিরাপত্তা")} description={t("Improve your security information", "আপনার নিরাপত্তা তথ্য উন্নত করুন")} progress={score} progressLabel={t("Security score", "নিরাপত্তা স্কোর")} />
      <p className="px-3 text-center text-lg font-black leading-7 text-[#e54b3f]">{t("Your account security is medium. Improve your security information.", "আপনার অ্যাকাউন্ট নিরাপত্তা স্তর মধ্যম, আপনার নিরাপত্তা তথ্য উন্নত করুন")}</p>
      <AccountCard title={t("Account information", "অ্যাকাউন্ট তথ্য")} icon={<ShieldCheck className="h-4 w-4" />}>
        <AccountRow icon={UserRound} title={t("Personal information", "ব্যক্তিগত তথ্য")} description={`${profile.username} · ${profile.phone || "ফোন যোগ করুন"}`} href="/profile" badge={profile.email || profile.phone ? "✓" : "!"} />
        <AccountRow icon={Mail} title={t("Email / phone verification", "ইমেইল / ফোন যাচাই")} description={profile.email || profile.phone || t("Add recovery information", "রিকভারি তথ্য যোগ করুন")} disabled={!profile.email && !profile.phone} />
        <AccountRow icon={KeyRound} title={t("Change login password", "লগইন পাসওয়ার্ড পরিবর্তন করুন")} description={t("Update your sign-in password", "আপনার লগইন পাসওয়ার্ড আপডেট করুন")} href="/forgot-password" />
      </AccountCard>
      <AccountCard title={t("Payment and activity", "পেমেন্ট ও কার্যকলাপ")} icon={<CreditCard className="h-4 w-4" />}>
        <AccountRow icon={Smartphone} title={t("Bind e-wallet", "ই-ওয়ালেট বাঁধুন")} description={t("Manage payment methods for withdrawal", "উত্তোলনের জন্য পেমেন্ট পদ্ধতি পরিচালনা করুন")} href="/wallet?tab=cards" />
        <AccountRow icon={CreditCard} title={t("Transaction password", "লেনদেন পাসওয়ার্ড")} description={t("Deposit and withdrawal records", "ডিপোজিট ও উত্তোলনের রেকর্ড")} href="/wallet?tab=history" />
        <AccountRow icon={Calendar} title={t("Member since", "সদস্য হওয়ার তারিখ")} description={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} disabled />
      </AccountCard>
      <AccountCard title={t("Referral code", "রেফারেল কোড")} icon={<Copy className="h-4 w-4" />}>
        <div className="flex items-center gap-2 rounded-xl bg-[#f4f8fc] p-2.5"><div className="min-w-0 flex-1 truncate font-black tracking-wider text-[#1f70c1]">{profile.referralCode}</div><button type="button" onClick={() => { navigator.clipboard?.writeText(profile.referralCode); toast.success(t("Copied", "কপি হয়েছে")); }} className="rounded-lg bg-[#1f70c1] p-2 text-white"><Copy className="h-4 w-4" /></button></div>
      </AccountCard>
      <AccountCard title={t("Session", "সেশন")} icon={<LogOut className="h-4 w-4" />}><AccountRow icon={LogOut} title={loggingOut ? t("Logging out...", "লগ আউট হচ্ছে...") : t("Logout", "লগআউট")} description={t("Securely logout from this device", "এই ডিভাইস থেকে নিরাপদে লগআউট করুন")} onClick={logout} disabled={loggingOut} /></AccountCard>
    </div>
    <FloatingAccountActions />
  </div>;
}
