"use client";

import { CrashGame } from "@/components/games/CrashGame";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";

export default function AviatorPage() {
  return (
    <div className="relative min-h-screen bg-[#0e0e0e] text-white">
      <ImmersiveBack />
      <CrashGame />
    </div>
  );
}
