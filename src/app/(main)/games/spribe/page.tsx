"use client";

import { ProviderGame } from "@/components/games/ProviderGame";

export default function Page() {
  return (
    <div className="space-y-3">
      <ProviderGame provider="spribe" titleEn="Spribe" titleBn="স্প্রাইব" />
    </div>
  );
}
