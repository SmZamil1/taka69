"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * Premium Aviator shell — embeds local game_aviator assets at top of games catalog.
 * Falls back to internal Crash engine if iframe assets fail.
 */
export default function AviatorPage() {
  const t = useLang((s) => s.t);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center gap-2">
        <Link
          href="/games"
          className="rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">Aviator</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/70">
            {t("Crash · live flight", "ক্র্যাশ · লাইভ ফ্লাইট")}
          </p>
        </div>
        <Link
          href="/games/crash"
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
        >
          {t("Classic engine", "ক্লাসিক ইঞ্জিন")}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-3 py-2">
          <span className="rounded-md bg-rose-500/90 px-2 py-0.5 text-[9px] font-black text-white">
            LIVE
          </span>
          <span className="text-[10px] font-semibold text-white/60">TAKA69 · Aviator</span>
        </div>
        <iframe
          title="Aviator"
          src="/game_aviator/index.html"
          className="h-[70vh] min-h-[420px] w-full border-0 bg-black"
          allow="autoplay; fullscreen"
        />
      </div>

      <p className="text-center text-[10px] text-white/35">
        {t(
          "Provably fair crash · virtual TK only",
          "প্রুভেবলি ফেয়ার ক্র্যাশ · শুধু ভার্চুয়াল TK"
        )}
      </p>
    </div>
  );
}
