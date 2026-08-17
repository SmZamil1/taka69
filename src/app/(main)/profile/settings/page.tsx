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
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { AccountCard, AccountHeader, AccountHero, AccountRow, FloatingAccountActions } from "@/components/account";

type Profile = { username: string; email: string | null; phone: string | null; balance: number; vipLevel: number; totalDeposit: number; totalBet: number; totalWin: number; totalCommission: number; referralCode: string; createdAt?: string; role?: string; avatar?: string | null };

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const [p, setP] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [hasTransactionPassword, setHasTransactionPassword] = useState(false);
  const [currentTransactionPassword, setCurrentTransactionPassword] = useState("");
  const [newTransactionPassword, setNewTransactionPassword] = useState("");
  const [confirmTransactionPassword, setConfirmTransactionPassword] = useState("");
  const [savingTransactionPassword, setSavingTransactionPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile", { credentials: "include" }).then((r) => r.json()).then((j) => { if (j.ok) setP(j.data); }).catch(() => {});
    fetch("/api/security/transaction-password", { credentials: "include" }).then((r) => r.json()).then((j) => { if (j.ok) setHasTransactionPassword(Boolean(j.data?.hasTransactionPassword)); }).catch(() => {});
  }, [user]);

  async function saveTransactionPassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingTransactionPassword(true);
    try {
      const res = await fetch("/api/security/transaction-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: currentTransactionPassword || undefined, newPassword: newTransactionPassword, confirmPassword: confirmTransactionPassword }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error || t("Could not save transaction password", "লেনদেন পাসওয়ার্ড সেভ করা যায়নি")); return; }
      setHasTransactionPassword(true);
      setCurrentTransactionPassword(""); setNewTransactionPassword(""); setConfirmTransactionPassword("");
      toast.success(t("Transaction password saved", "লেনদেন পাসওয়ার্ড সেভ হয়েছে"));
    } catch { toast.error(t("Network error", "নেটওয়ার্ক সমস্যা")); }
    finally { setSavingTransactionPassword(false); }
  }

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
      <p className="mx-auto max-w-md px-3 text-center text-sm font-black leading-6 text-[#e54b3f] sm:text-base">{t("Your account security is medium. Improve your security information.", "আপনার অ্যাকাউন্ট নিরাপত্তা স্তর মধ্যম, আপনার নিরাপত্তা তথ্য উন্নত করুন")}</p>
      <AccountCard title={t("Account information", "অ্যাকাউন্ট তথ্য")} icon={<ShieldCheck className="h-4 w-4" />}>
        <AccountRow icon={UserRound} title={t("Personal information", "ব্যক্তিগত তথ্য")} description={`${profile.username} · ${profile.phone || "ফোন যোগ করুন"}`} href="/profile" badge={profile.email || profile.phone ? "✓" : "!"} />
        <AccountRow icon={Mail} title={t("Email / phone verification", "ইমেইল / ফোন যাচাই")} description={profile.email || profile.phone || t("Add recovery information", "রিকভারি তথ্য যোগ করুন")} disabled={!profile.email && !profile.phone} />
        <AccountRow icon={KeyRound} title={t("Change login password", "লগইন পাসওয়ার্ড পরিবর্তন করুন")} description={t("Update your sign-in password", "আপনার লগইন পাসওয়ার্ড আপডেট করুন")} href="/forgot-password" />
      </AccountCard>
      <AccountCard title={t("Payment and activity", "পেমেন্ট ও কার্যকলাপ")} icon={<CreditCard className="h-4 w-4" />}>
        <AccountRow icon={Smartphone} title={t("Bind e-wallet", "ই-ওয়ালেট বাঁধুন")} description={t("Manage payment methods for withdrawal", "উত্তোলনের জন্য পেমেন্ট পদ্ধতি পরিচালনা করুন")} href="/wallet/bind" />
        <AccountRow icon={CreditCard} title={t("My cards", "আমার কার্ড")} description={t("View bound withdrawal wallets", "বাঁধা উত্তোলন ওয়ালেট দেখুন")} href="/wallet/cards" />
        <AccountRow icon={Calendar} title={t("Member since", "সদস্য হওয়ার তারিখ")} description={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"} disabled />
      </AccountCard>
      <AccountCard title={t("Transaction password", "লেনদেন পাসওয়ার্ড")} icon={<KeyRound className="h-4 w-4" />}>
        <p className="mb-3 text-xs text-[var(--muted)]">{hasTransactionPassword ? t("Required to authorize withdrawals.", "উত্তোলন অনুমোদনের জন্য প্রয়োজনীয়।") : t("Create one before your first withdrawal.", "প্রথম উত্তোলনের আগে একটি সেট করুন।")}</p>
        <form onSubmit={saveTransactionPassword} className="space-y-2">
          {hasTransactionPassword && <input type="password" value={currentTransactionPassword} onChange={(e) => setCurrentTransactionPassword(e.target.value)} placeholder={t("Current transaction password", "বর্তমান লেনদেন পাসওয়ার্ড")} className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm outline-none" />}
          <input type="password" value={newTransactionPassword} onChange={(e) => setNewTransactionPassword(e.target.value)} placeholder={t("New transaction password", "নতুন লেনদেন পাসওয়ার্ড")} required minLength={4} className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm outline-none" />
          <input type="password" value={confirmTransactionPassword} onChange={(e) => setConfirmTransactionPassword(e.target.value)} placeholder={t("Confirm transaction password", "লেনদেন পাসওয়ার্ড নিশ্চিত করুন")} required minLength={4} className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm outline-none" />
          <button type="submit" disabled={savingTransactionPassword} className="min-h-11 w-full rounded-xl bg-[var(--accent)] px-3 text-sm font-black text-[var(--ink-strong)] disabled:opacity-50">{savingTransactionPassword ? t("Saving...", "সেভ হচ্ছে...") : t("Save transaction password", "লেনদেন পাসওয়ার্ড সেভ করুন")}</button>
        </form>
      </AccountCard>
      <AccountCard title={t("Appearance", "দেখতে কেমন হবে")} icon={<span className="text-base">✦</span>}>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--ink-strong)]">{t("Theme", "থিম")}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{t("Choose how TAKA69 looks on this device", "এই ডিভাইসে TAKA69-এর চেহারা বেছে নিন")}</p>
          </div>
          <select
            aria-label={t("Theme", "থিম")}
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeMode)}
            className="theme-select min-h-10 shrink-0 rounded-xl px-3 text-sm font-bold outline-none"
          >
            <option value="auto">{t("Auto", "অটো")}</option>
            <option value="light">{t("Light", "লাইট")}</option>
            <option value="dark">{t("Dark", "ডার্ক")}</option>
          </select>
        </div>
      </AccountCard>
      <AccountCard title={t("Referral code", "রেফারেল কোড")} icon={<Copy className="h-4 w-4" />}>
        <div className="flex items-center gap-2 rounded-xl bg-[#f4f8fc] p-2.5"><div className="min-w-0 flex-1 truncate font-black tracking-wider text-[#1f70c1]">{profile.referralCode}</div><button type="button" onClick={() => { navigator.clipboard?.writeText(profile.referralCode); toast.success(t("Copied", "কপি হয়েছে")); }} className="rounded-lg bg-[#1f70c1] p-2 text-white"><Copy className="h-4 w-4" /></button></div>
      </AccountCard>
      <AccountCard title={t("Session", "সেশন")} icon={<LogOut className="h-4 w-4" />}><AccountRow icon={LogOut} title={loggingOut ? t("Logging out...", "লগ আউট হচ্ছে...") : t("Logout", "লগআউট")} description={t("Securely logout from this device", "এই ডিভাইস থেকে নিরাপদে লগআউট করুন")} onClick={logout} disabled={loggingOut} /></AccountCard>
    </div>
    <FloatingAccountActions />
  </div>;
}
