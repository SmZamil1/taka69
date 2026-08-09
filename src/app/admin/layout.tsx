"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, ArrowLeftRight, Settings, Home,
  Shield, Wallet, Headphones, Bell, Gamepad2, Image as ImageIcon,
  Target, Zap, Crown, BarChart2, Gift
} from "lucide-react";

const nav = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/games",         label: "Games",        icon: Gamepad2 },
  { href: "/admin/banners",       label: "Banners",      icon: ImageIcon },
  { href: "/admin/users",         label: "Users",        icon: Users },
  { href: "/admin/wallet",        label: "Wallet",       icon: Wallet },
  { href: "/admin/wingo",         label: "WinGo",        icon: Zap },
  { href: "/admin/missions",      label: "Missions",     icon: Target },
  { href: "/admin/vip",           label: "VIP",          icon: Crown },
  { href: "/admin/support",       label: "Support",      icon: Headphones },
  { href: "/admin/notifications", label: "Notify",       icon: Bell },
  { href: "/admin/promotions",    label: "Promos",       icon: Gift },
  { href: "/admin/transactions",  label: "Ledger",       icon: ArrowLeftRight },
  { href: "/admin/reports",       label: "Reports",      icon: BarChart2 },
  { href: "/admin/settings",      label: "Settings",     icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const path = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!["ADMIN","MODERATOR","SUPPORT"].includes(user.role)) router.replace("/");
  }, [user, loading, router]);

  // Fetch pending wallet requests count
  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setPendingCount((j.data.pendingDeposits || 0) + (j.data.pendingWithdraws || 0)); })
      .catch(() => {});
  }, []);

  if (loading || !user || !["ADMIN","MODERATOR","SUPPORT"].includes(user.role)) {
    return <div className="flex min-h-screen items-center justify-center text-emerald-200/70">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-[#060e06] text-emerald-50">
      <header className="sticky top-0 z-30 border-b border-emerald-900/50 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Shield className="h-5 w-5 text-amber-400" />
          <span className="font-black text-amber-400">TAKA69</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">ADMIN</span>
          <span className="text-xs text-emerald-200/40">@{user.username} · {user.role}</span>
          {pendingCount > 0 && (
            <Link href="/admin/wallet"
              className="ml-2 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              ⚠️ {pendingCount} pending
            </Link>
          )}
          <Link href="/" className="ml-auto flex items-center gap-1 text-xs text-emerald-200/50 hover:text-white">
            <Home className="h-3.5 w-3.5" /> Site
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2 scrollbar-none">
          {nav.map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            const Icon = n.icon;
            const isPending = n.href === "/admin/wallet" && pendingCount > 0;
            return (
              <Link key={n.href} href={n.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition",
                  active ? "bg-amber-400 text-emerald-950" : "bg-emerald-950/80 text-emerald-100 hover:bg-emerald-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
                {isPending && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
