"use client";

import { ProviderGame } from "@/components/games/ProviderGame";

export default function Page() {
  return (
    <div className="space-y-3">
      <ProviderGame provider="jdb" titleEn="JDB" titleBn="জেডিবি" />
    </div>
  );
}
