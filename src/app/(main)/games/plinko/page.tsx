"use client";

import { useEffect, useState } from "react";
import { PlinkoGame } from "@/components/games/PlinkoGame";

export default function Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-3">
      {!ready ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
        </div>
      ) : (
        <PlinkoGame />
      )}
    </div>
  );
}
