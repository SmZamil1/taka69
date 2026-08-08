"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Settings,
  Home,
  Shield,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "ADMIN" && user.role !== "MODERATOR") router.replace("/");
  }, [user, loading, router]);

  if (loading || !user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return (
      <div className="flex min-h-screen items-center justify-center text-emerald-200/70">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070f07] text-emerald-50">
      <header className="sticky top-0 z-30 border-b border-emerald-900 bg-surface-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Shield className="h-5 w-5 text-gold-400" />
          <span className="font-black text-gold-400">TAKA69 Admin</span>
          <span className="text-xs text-emerald-200/50">@{user.username}</span>
          <Link
            href="/"
            className="ml-auto flex items-center gap-1 text-xs text-emerald-200/70 hover:text-white"
          >
            <Home className="h-3.5 w-3.5" /> Site
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((n) => {
            const active = path === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                  active
                    ? "bg-gold-500 text-emerald-950"
                    : "bg-emerald-950 text-emerald-100 hover:bg-emerald-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
