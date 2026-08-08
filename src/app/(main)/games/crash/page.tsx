"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CrashGame } from "@/components/games/CrashGame";
import { useLang } from "@/hooks/useLang";

export default function CrashPage() {
  const t = useLang((s) => s.t);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">
            Aviator
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/70">
            {t("Crash · live flight", "ক্র্যাশ · লাইভ ফ্লাইট")}
          </p>
        </div>
        <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
          {t("play money", "প্লে-মানি")}
        </span>
      </div>
      <CrashGame />
    </div>
  );
}
