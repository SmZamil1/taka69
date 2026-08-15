"use client";

import { CrashGame } from "@/components/games/CrashGame";

/** Immersive crash — chrome comes from CrashGame mini-bar only */
export default function CrashPage() {
  return (
    <div className="min-h-screen bg-black">
      <CrashGame />
    </div>
  );
}
