"use client";

import { ProviderGame } from "@/components/games/ProviderGame";

export default function Page() {
  return (
    <div className="space-y-3">
      <ProviderGame provider="jdb" titleEn="Lucky Frog" titleBn="লাকি ফ্রগ" />
    </div>
  );
}
