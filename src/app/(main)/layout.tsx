"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { SupportChat } from "@/components/support/SupportChat";
import { PromoPopup } from "@/components/home/PromoPopup";
import { DepositGate } from "@/components/games/DepositGate";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";
import { GameBackBar } from "@/components/layout/GameBackBar";
import { PresenceHeartbeat } from "@/components/layout/PresenceHeartbeat";
import { useBrand } from "@/hooks/useBrand";
import { Headphones, Send } from "lucide-react";

function isImmersiveGame(path: string) {
  if (path.startsWith("/games/")) return true;
  if (path.startsWith("/wingo")) return true;
  if (path.startsWith("/game_aviator")) return true;
  return false;
}

/** Games that already show their own balance UI */
function hasOwnBalanceUi(path: string) {
  return (
    path.startsWith("/games/aviator") ||
    path.startsWith("/games/fortune-maya") ||
    path.startsWith("/games/extreme-plinko") ||
    path.startsWith("/games/plinko") ||
    path.startsWith("/game_aviator")
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const path = usePathname() || "/";
  const immersive = isImmersiveGame(path);
  const brand = useBrand();

  // close social stack on route change
  useEffect(() => {
    setSocialOpen(false);
    setSupport(false);
  }, [path]);

  if (immersive) {
    return (
      <div className="jeta-shell mx-auto min-h-screen max-w-lg bg-black">
        <PresenceHeartbeat />
        <GameBackBar
          href={path.startsWith("/wingo") ? "/" : "/games"}
          showBalance={!hasOwnBalanceUi(path)}
        />
        <main className="min-h-screen pt-12">{children}</main>
        <DepositGate />
        <NotificationPrompt />
      </div>
    );
  }

  return (
    <div className="jeta-shell mx-auto min-h-screen max-w-lg pb-28">
      <PresenceHeartbeat />
      <TopBar onMenu={() => setMenu(true)} onSupport={() => setSupport(true)} />
      <main className="px-3 py-3">{children}</main>
      <BottomNav />
      <SideDrawer open={menu} onClose={() => setMenu(false)} />
      <SupportChat open={support} onClose={() => setSupport(false)} floating={false} />
      <PromoPopup />
      <DepositGate />
      <NotificationPrompt />

      {/* Floating stack: headphones toggles Telegram + WhatsApp */}
      <div className="fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2">
        {socialOpen && (
          <>
            <a
              href={brand.telegramUrl || "https://t.me/"}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-lg ring-2 ring-white/20 active:scale-95"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
            </a>
            <a
              href={brand.whatsappUrl || "https://wa.me/"}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 text-white shadow-lg ring-2 ring-white/20 active:scale-95"
              aria-label="WhatsApp"
            >
              <span className="text-lg font-black">W</span>
            </a>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setSocialOpen((v) => !v);
            setSupport(true);
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-yellow-500 text-emerald-950 shadow-lg ring-2 ring-amber-200/40 active:scale-95"
          aria-label="Support"
        >
          <Headphones className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
