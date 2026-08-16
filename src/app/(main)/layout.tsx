"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { SupportChat } from "@/components/support/SupportChat";
import { SupportChoiceModal } from "@/components/support/SupportChoiceModal";
import { PromoPopup } from "@/components/home/PromoPopup";
import { DepositGate } from "@/components/games/DepositGate";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";
import { GameBackBar } from "@/components/layout/GameBackBar";
import { PresenceHeartbeat } from "@/components/layout/PresenceHeartbeat";
import { useBrand } from "@/hooks/useBrand";
import { Bot, Headphones, Send } from "lucide-react";
import { AppDownloadModal } from "@/components/account";

function isImmersiveGame(path: string) {
  if (path.startsWith("/games/")) return true;
  if (path.startsWith("/wingo")) return true;
  if (path.startsWith("/game_aviator")) return true;
  return false;
}

function hasOwnBalanceUi(path: string) {
  return (
    path.startsWith("/games/aviator") ||
    path.startsWith("/games/crash") ||
    path.startsWith("/games/crash2") ||
    path.startsWith("/games/fortune-maya") ||
    path.startsWith("/games/extreme-plinko") ||
    path.startsWith("/games/plinko") ||
    path.startsWith("/games/mystical-forest") ||
    path.startsWith("/games/cherry-charm") ||
    path.startsWith("/games/pixi-slots") ||
    path.startsWith("/game_aviator")
  );
}

function hidesGameBackBar(path: string) {
  return (
    path.startsWith("/games/aviator") ||
    path.startsWith("/games/crash") ||
    path.startsWith("/games/crash2") ||
    path.startsWith("/game_aviator") ||
    path.startsWith("/games/fortune-maya") ||
    path.startsWith("/games/extreme-plinko") ||
    path.startsWith("/games/mystical-forest") ||
    path.startsWith("/games/cherry-charm") ||
    path.startsWith("/games/pixi-slots")
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);
  const [supportChoice, setSupportChoice] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const path = usePathname() || "/";
  const immersive = isImmersiveGame(path);
  const brand = useBrand();

  useEffect(() => {
    setSocialOpen(false);
    setSupport(false);
    setSupportChoice(false);
  }, [path]);

  useEffect(() => {
    const openSupport = () => setSupportChoice(true);
    window.addEventListener("taka69:open-support", openSupport);
    return () => window.removeEventListener("taka69:open-support", openSupport);
  }, []);

  if (immersive) {
    const bare = hidesGameBackBar(path);
    return (
      <div className="jeta-shell mx-auto min-h-screen max-w-lg bg-[#020907]">
        <PresenceHeartbeat />
        {!bare && (
          <GameBackBar
            href={path.startsWith("/wingo") ? "/" : "/games"}
            showBalance={!hasOwnBalanceUi(path)}
          />
        )}
        <main className={bare ? "min-h-screen" : "min-h-screen pt-12"}>{children}</main>
        <DepositGate />
        <NotificationPrompt />
      </div>
    );
  }

  return (
    <div className="jeta-shell mx-auto min-h-screen max-w-lg overflow-x-clip pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
      <PresenceHeartbeat />
      <TopBar onMenu={() => setMenu(true)} onSupport={() => setSupportChoice(true)} />
      <main className="min-w-0 px-3 py-3">{children}</main>
      <BottomNav />
      <SideDrawer open={menu} onClose={() => setMenu(false)} />
      <SupportChat open={support} onClose={() => setSupport(false)} floating={false} />
      <SupportChoiceModal open={supportChoice} onClose={() => setSupportChoice(false)} onOpenChat={() => { setSupportChoice(false); setSupport(true); }} />
      <PromoPopup />
      <DepositGate />
      <NotificationPrompt />
      <AppDownloadModal />

      <div className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] right-3 z-40 flex flex-col items-end gap-2">
        {socialOpen && (
          <>
            <a
              href={brand.telegramUrl || "https://t.me/"}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100/20 bg-[#0e3327] text-mint-300 shadow-lg ring-1 ring-emerald-100/15 active:scale-95"
              aria-label="Telegram"
            >
              <Send className="h-5 w-5" />
            </a>
            <a
              href={brand.whatsappUrl || "https://wa.me/"}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-100/20 bg-[#0a291f] text-emerald-100 shadow-lg ring-1 ring-emerald-100/15 active:scale-95"
              aria-label="WhatsApp"
            >
              <span className="text-lg font-black">W</span>
            </a>
            <button
              type="button"
              onClick={() => setSupport((v) => !v)}
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg ring-1 active:scale-95 ${
                support
                  ? "bg-emerald-400 text-[#063326] ring-mint-200/70"
                  : "bg-[#0d3025] text-mint-300 ring-emerald-100/20"
              }`}
              aria-label="Support bot chat"
            >
              <Bot className="h-5 w-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setSocialOpen((v) => {
              if (v) setSupport(false);
              return !v;
            });
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-[#18200e] shadow-gold ring-2 ring-gold-300/30 active:scale-95"
          aria-label="Open contact icons"
        >
          <Headphones className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
