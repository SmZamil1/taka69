"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Moderation panel — wallet deposit/withdraw control for MODERATOR/ADMIN */
export default function ModerationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/wallet?panel=moderation");
  }, [router]);
  return (
    <div className="flex h-40 items-center justify-center text-white/50">
      Opening moderation desk…
    </div>
  );
}
