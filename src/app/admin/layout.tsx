"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useBrand } from "@/hooks/useBrand";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Settings,
  Home,
  Shield,
  Wallet,
  Headphones,
  Bell,
  Gamepad2,
  Image as ImageIcon,
  Target,
  Zap,
  Crown,
  BarChart2,
  Gift,
  Menu,
  X,
  Activity,
  Scale,
  Server,
} from "lucide-react";
import type { StaffPermission } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: StaffPermission;
  badgeKey?: "wallet" | "support";
};

type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Control",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
      { href: "/admin/live", label: "Live users", icon: Activity, perm: "dashboard" },
    ],
  },
  {
    title: "Money",
    items: [
      { href: "/admin/wallet", label: "Wallet", icon: Wallet, perm: "wallet", badgeKey: "wallet" },
      { href: "/admin/moderation", label: "Moderation", icon: Scale, perm: "moderation", badgeKey: "wallet" },
      { href: "/admin/transactions", label: "Ledger", icon: ArrowLeftRight, perm: "transactions" },
    ],
  },
  {
    title: "Players",
    items: [
      { href: "/admin/users", label: "Users & roles", icon: Users, perm: "users" },
      { href: "/admin/admins", label: "Admins access", icon: Shield, perm: "users" },
      { href: "/admin/support", label: "Support desk", icon: Headphones, perm: "support", badgeKey: "support" },
      { href: "/admin/vip", label: "VIP", icon: Crown, perm: "vip" },
    ],
  },
  {
    title: "Games",
    items: [
      { href: "/admin/games", label: "Game control", icon: Gamepad2, perm: "games" },
      { href: "/admin/wingo", label: "WinGo", icon: Zap, perm: "wingo" },
      { href: "/admin/banners", label: "Covers & banners", icon: ImageIcon, perm: "banners" },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/admin/missions", label: "Missions", icon: Target, perm: "missions" },
      { href: "/admin/promotions", label: "Promos", icon: Gift, perm: "promotions" },
      { href: "/admin/notifications", label: "Notify", icon: Bell, perm: "notifications" },
      { href: "/admin/reports", label: "Reports", icon: BarChart2, perm: "reports" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings" },
      { href: "/admin/system", label: "System", icon: Server, perm: "system" },
    ],
  },
];

const ROLE_DEFAULTS: Record<string, StaffPermission[]> = {
  ADMIN: GROUPS.flatMap((g) => g.items.map((i) => i.perm)),
  MODERATOR: ["dashboard", "users", "wallet", "moderation", "support", "games", "transactions", "reports"],
  SUPPORT: ["dashboard", "support"],
};

function permsOf(user: { role: string; permissions?: unknown }): StaffPermission[] {
  if (user.role === "ADMIN") return ROLE_DEFAULTS.ADMIN;
  if (Array.isArray(user.permissions) && user.permissions.length) {
    return user.permissions as StaffPermission[];
  }
  return ROLE_DEFAULTS[user.role] || [];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const path = usePathname();
  const router = useRouter();
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [pendingWallet, setPendingWallet] = useState(0);
  const [openSupport, setOpenSupport] = useState(0);
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!["ADMIN", "MODERATOR", "SUPPORT"].includes(user.role)) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    let dead = false;
    async function pull() {
      try {
        const res = await fetch("/api/admin/live", { credentials: "include" });
        const j = await res.json();
        if (!dead && j.ok) {
          setPendingWallet((j.data.pendingDeposits || 0) + (j.data.pendingWithdraws || 0));
          setOpenSupport(j.data.openSupportThreads || 0);
          setOnline(j.data.online || 0);
        }
      } catch {
        /* */
      }
    }
    pull();
    const id = window.setInterval(pull, 5000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, []);

  const allowed = useMemo(() => (user ? permsOf(user as { role: string; permissions?: unknown }) : []), [user]);

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => allowed.includes(i.perm)),
      })).filter((g) => g.items.length),
    [allowed]
  );

  if (loading || !user || !["ADMIN", "MODERATOR", "SUPPORT"].includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050a08] text-emerald-200/70">
        Checking access…
      </div>
    );
  }

  function NavBody() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-2 ring-amber-400/40">
            <Image src={brand.logoUrl || "/icons/logo.png"} alt={brand.siteName} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-amber-300">{brand.siteName || "TAKA69"}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Control Center</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((g) => (
            <div key={g.title} className="mb-4">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.items.map((n) => {
                  const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
                  const Icon = n.icon;
                  const badge =
                    n.badgeKey === "wallet" ? pendingWallet : n.badgeKey === "support" ? openSupport : 0;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition",
                        active
                          ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-emerald-950 shadow"
                          : "text-emerald-50/75 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{n.label}</span>
                      {badge > 0 && (
                        <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
            <span className="text-white/50">Live now</span>
            <span className="font-black text-emerald-300">{online}</span>
          </div>
          <div className="truncate text-[11px] text-white/40">
            @{user?.username} · {user?.role}
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-300/80 hover:text-amber-200"
          >
            <Home className="h-3.5 w-3.5" /> Back to site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a08] text-emerald-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#07140f] md:block">
        <NavBody />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-[#07140f] shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1 text-white/60"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <NavBody />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Shield className="hidden h-4 w-4 text-amber-400 md:block" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">Premium Control Center</div>
              <div className="text-[11px] text-white/40">Live ops · wallet · games · support</div>
            </div>
            {pendingWallet > 0 && (
              <Link
                href="/admin/moderation"
                className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300"
              >
                {pendingWallet} pending
              </Link>
            )}
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              ● {online} online
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-3 py-5 md:px-6">{children}</main>
      </div>
    </div>
  );
}
