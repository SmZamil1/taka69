"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MinesGame } from "@/components/games/MinesGame";

export default function MinesPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="rounded-lg p-2 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-amber-300">Mines</h1>
      </div>
      <MinesGame />
    </div>
  );
}
