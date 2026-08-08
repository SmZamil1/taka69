"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";

const actions = [
  { href: "/wallet", en: "Bonus", bn: "বোনাস", emoji: "💰" },
  { href: "/wallet", en: "Wallet", bn: "ওয়ালেট", emoji: "👛" },
  { href: "/rewards", en: "Cashback*", bn: "ক্যাশব্যাক*", emoji: "🪙" },
  { href: "/rewards", en: "Missions", bn: "মিশন", emoji: "📘" },
];

export function QuickActions() {
  const t = useLang((s) => s.t);
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <Link
          key={a.en}
          href={a.href}
          className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-amber-700/80 to-amber-900/80 border border-gold-500/20 px-1 py-2.5 text-center shadow"
        >
          <span className="text-xl">{a.emoji}</span>
          <span className="text-[10px] font-semibold text-amber-50 leading-tight">
            {t(a.en, a.bn)}
          </span>
        </Link>
      ))}
    </div>
  );
}
