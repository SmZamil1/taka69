"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { SupportChat } from "@/components/support/SupportChat";
import { PromoPopup } from "@/components/home/PromoPopup";
import { DepositGate } from "@/components/games/DepositGate";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";
import { GameBackBar } from "@/components/layout/GameBackBar";
import { Headphones, Send, Facebook } from "lucide-react";

function isImmersiveGame(path: string) {
  if (path.startsWith("/games/")) return true;
  if (path.startsWith("/wingo")) return true;
  if (path.startsWith("/game_aviator")) return true;
  return false;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);
  const path = usePathname() || "/";
  const immersive = isImmersiveGame(path);

  if (immersive) {
    return (
      <div className="jeta-shell mx-auto min-h-screen max-w-lg bg-black">
        <GameBackBar href={path.startsWith("/wingo") ? "/" : "/games"} />
        <main className="min-h-screen pt-12">{children}</main>
        <DepositGate />
        <NotificationPrompt />
      </div>
    );
  }

  return (
    <div className="jeta-shell mx-auto min-h-screen max-w-lg pb-28">
      <TopBar onMenu={() => setMenu(true)} onSupport={() => setSupport(true)} />
      <main className="px-3 py-3">{children}</main>
      <BottomNav />
      <SideDrawer open={menu} onClose={() => setMenu(false)} />
      <SupportChat open={support} onClose={() => setSupport(false)} floating={!support} />
      <PromoPopup />
      <DepositGate />
      <NotificationPrompt />

      <div className="fixed bottom-24 right-3 z-40 flex flex-col gap-2">
        <a
          href="https://t.me/"
          target="_blank"
          rel="noreferrer"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg ring-2 ring-amber-400/40 active:scale-95"
          aria-label="Telegram"
        >
          <Send className="h-5 w-5" />
        </a>
        <a
          href="https://facebook.com/"
          target="_blank"
          rel="noreferrer"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg ring-2 ring-amber-400/40 active:scale-95"
          aria-label="Facebook"
        >
          <Facebook className="h-5 w-5" />
        </a>
        <button
          type="button"
          onClick={() => setSupport(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg ring-2 ring-amber-400/40 active:scale-95"
          aria-label="Support"
        >
          <Headphones className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
