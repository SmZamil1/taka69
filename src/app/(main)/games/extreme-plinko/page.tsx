"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function Page() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/games" className="rounded-full border border-white/10 bg-white/5 p-2"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-lg font-black">Extreme Plinko</h1>
      </div>
      <iframe title="Extreme Plinko" src="/assets/games/extreme_plinko/index.html" className="h-[70vh] w-full rounded-2xl border border-white/10 bg-black" />
    </div>
  );
}
