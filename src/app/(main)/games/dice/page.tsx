"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DiceGame } from "@/components/games/DiceGame";

export default function DicePage() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="rounded-lg p-2 hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-indigo-300">Dice</h1>
      </div>
      <DiceGame />
    </div>
  );
}
