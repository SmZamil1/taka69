"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";

/** Pings /api/presence every few seconds while logged in */
export function PresenceHeartbeat() {
  const user = useAuthStore((s) => s.user);
  const path = usePathname() || "/";

  useEffect(() => {
    if (!user) return;
    let dead = false;
    async function beat() {
      if (dead) return;
      try {
        await fetch("/api/presence", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
      } catch {
        /* */
      }
    }
    beat();
    const id = window.setInterval(beat, 12_000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, [user, path]);

  return null;
}
