"use client";

import { StudioGame } from "@/components/games/StudioGame";

export default function Page() {
  return (
    <div className="space-y-3">
      <StudioGame gameId="tiger" />
    </div>
  );
}
