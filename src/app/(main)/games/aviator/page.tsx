"use client";

import { CrashGame } from "@/components/games/CrashGame";

/**
 * Immersive native Aviator — chrome hidden by main layout.
 * Real wallet via /api/games/crash.
 */
export default function AviatorPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <CrashGame />
    </div>
  );
}
