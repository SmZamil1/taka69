"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CrashGame } from "@/components/games/CrashGame";
import { useLang } from "@/hooks/useLang";
import { useAuthStore } from "@/hooks/useAuth";
import { formatCoins } from "@/lib/utils";

export default function CrashPage() {
  const t = useLang((s) => s.t);
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href="/games"
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-tight text-white">Aviator Crash</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/70">
            {t("Crash · live flight", "ক্র্যাশ · লাইভ ফ্লাইট")}
          </p>
        </div>
        {user && (
          <div className="rounded-full border border-amber-400/35 bg-black/45 px-3 py-1.5 text-xs font-black text-amber-300">
            ৳{formatCoins(user.balance)}
          </div>
        )}
      </div>
      <CrashGame />
    </div>
  );
}
