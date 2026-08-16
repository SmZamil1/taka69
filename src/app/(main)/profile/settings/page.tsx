"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatBdt } from "@/lib/utils";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";
import { ArrowLeft, Copy, Mail, Phone, User, Crown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/useToast";

type Profile = {
  username: string;
  email: string | null;
  phone: string | null;
  balance: number;
  vipLevel: number;
  totalDeposit: number;
  totalBet: number;
  totalWin: number;
  totalCommission: number;
  referralCode: string;
  createdAt?: string;
  role?: string;
};

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const toast = useToast();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setP(j.data);
      });
  }, [user?.id]);

  if (!user) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-white/50">{t("Please login", "লগইন করুন")}</p>
        <Link href="/login" className="text-amber-300 font-bold">
          Login
        </Link>
      </div>
    );
  }

  const rows = [
    { icon: User, en: "Username", bn: "ইউজারনেম", v: p?.username || user.username },
    { icon: Mail, en: "Email", bn: "ইমেইল", v: p?.email || "—" },
    { icon: Phone, en: "Phone", bn: "ফোন", v: p?.phone || "—" },
    { icon: Crown, en: "VIP level", bn: "ভিআইপি লেভেল", v: `VIP${p?.vipLevel ?? user.vipLevel ?? 0}` },
    { icon: Calendar, en: "Member since", bn: "সদস্য", v: p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-white/10 bg-white/5 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black text-white">{t("Profile details", "প্রোফাইল বিবরণ")}</h1>
      </div>

      <div className="rounded-2xl border border-emerald-700/40 bg-[#0a3d2a] p-5 text-center">
        <div className="mx-auto h-16 w-16 overflow-hidden rounded-2xl border-2 border-amber-200/70 bg-amber-300 shadow-xl">
          <img src={user.avatar || DEFAULT_PROFILE_AVATAR} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="mt-2 text-xl font-black text-white">{p?.username || user.username}</div>
        <div className="mt-1 text-lg font-black text-amber-300">
          {formatBdt(p?.balance ?? user.balance)}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-800/40 bg-[#0a3d2a]">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.en}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5 last:border-0"
            >
              <Icon className="h-4 w-4 text-emerald-200/70" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/40">{t(r.en, r.bn)}</div>
                <div className="truncate text-sm font-semibold text-white">{r.v}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center gap-2">
        <div className="flex-1">
          <div className="text-[10px] text-white/40">{t("Referral code", "রেফারেল কোড")}</div>
          <div className="font-black tracking-wider text-amber-300">
            {p?.referralCode || user.username}
          </div>
        </div>
        <button
          type="button"
          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-emerald-950"
          onClick={() => {
            const code = p?.referralCode || user.username;
            navigator.clipboard?.writeText(code);
            toast.success(t("Copied", "কপি হয়েছে"));
          }}
        >
          <Copy className="inline h-3.5 w-3.5 mr-1" />
          {t("Copy", "কপি")}
        </button>
      </div>

      {p && (
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { en: "Deposit", bn: "ডিপোজিট", v: p.totalDeposit },
            { en: "Bet", bn: "বেট", v: p.totalBet },
            { en: "Win", bn: "জয়", v: p.totalWin },
            { en: "Commission", bn: "কমিশন", v: p.totalCommission },
          ].map((s) => (
            <div key={s.en} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] text-white/40">{t(s.en, s.bn)}</div>
              <div className="text-sm font-black text-amber-300">{formatBdt(s.v)}</div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/profile"
        className="block text-center text-sm font-bold text-emerald-200/70"
      >
        {t("Back to member", "সদস্য পেজে ফিরুন")}
      </Link>
    </div>
  );
}
