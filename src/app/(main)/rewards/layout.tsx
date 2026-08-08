import { Suspense } from "react";

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-4 text-emerald-200/60">Loading…</div>}>{children}</Suspense>;
}
