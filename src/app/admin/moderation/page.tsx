"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Moderation panel — wallet deposit/withdraw control for MODERATOR/ADMIN */
export default function ModerationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/wallet?type=DEPOSIT&status=PENDING");
  }, [router]);
  return (
    <div className="flex h-40 items-center justify-center text-white/50">
      Opening pending wallet reviews…
    </div>
  );
}
