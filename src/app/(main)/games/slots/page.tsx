"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SlotsGame } from "@/components/games/SlotsGame";

export default function SlotsPage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="rounded-lg p-2 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-fuchsia-300">Slots</h1>
      </div>
      <SlotsGame />
    </div>
  );
}
