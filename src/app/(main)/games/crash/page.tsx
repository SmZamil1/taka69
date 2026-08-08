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
        <Link href="/" className="rounded-lg p-2 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-rose-400">Crash</h1>
        <span className="ml-auto text-[10px] text-emerald-200/50">
          {t("play money", "প্লে-মানি")}
        </span>
      </div>
      <CrashGame />
    </div>
  );
}
