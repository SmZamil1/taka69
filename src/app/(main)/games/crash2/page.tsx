"use client";

import { CrashGame } from "@/components/games/CrashGame";
import { ImmersiveBack } from "@/components/layout/ImmersiveBack";

export default function Crash2Page() {
  return (
    <div className="relative min-h-screen bg-black">
      <ImmersiveBack />
      <CrashGame />
    </div>
  );
}
