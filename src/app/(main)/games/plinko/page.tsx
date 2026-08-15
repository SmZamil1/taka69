"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlinkoGame } from "@/components/games/PlinkoGame";

export default function Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/games" className="rounded-lg p-2 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-gold-300">Plinko</h1>
      </div>
      {!ready ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
        </div>
      ) : (
        <PlinkoGame />
      )}
    </div>
  );
}
