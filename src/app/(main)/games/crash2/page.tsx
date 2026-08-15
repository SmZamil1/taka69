"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CrashGame } from "@/components/games/CrashGame";
import { useLang } from "@/hooks/useLang";

export default function Crash2Page() {
  const t = useLang((s) => s.t);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href="/games"
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">Crash X</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/70">
            {t("Fast crash mode", "ফাস্ট ক্র্যাশ মোড")}
          </p>
        </div>
      </div>
      <CrashGame />
    </div>
  );
}
