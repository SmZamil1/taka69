"use client";

import { ProviderGame } from "@/components/games/ProviderGame";

export default function Page() {
  return (
    <div className="space-y-3">
      <ProviderGame provider="spribe" titleEn="Fortune Plane" titleBn="ফরচুন প্লেন" />
    </div>
  );
}
