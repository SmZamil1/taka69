"use client";

import Link from "next/link";
import { BarChart3, ExternalLink, LayoutDashboard, RefreshCw, ShieldAlert, WalletCards } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function AdminQuickTools() {
  const path = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    window.dispatchEvent(new Event("taka69:admin-refresh"));
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 650);
  }

  const actions = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert },
    { href: "/admin/transactions", label: "Ledger", icon: BarChart3 },
    { href: "/admin/wallet", label: "Wallet", icon: WalletCards },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
      <div className="mr-auto hidden min-w-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:block">
        Operations shortcuts
      </div>
      {actions.map((action) => {
        const Icon = action.icon;
        const active = action.href === "/admin" ? path === "/admin" : path.startsWith(action.href);
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold transition ${
              active ? "bg-amber-400 text-emerald-950" : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={refresh}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-[11px] font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
        aria-label="Refresh admin data"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
      <Link
        href="/"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-400/20"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Site
      </Link>
    </div>
  );
}
