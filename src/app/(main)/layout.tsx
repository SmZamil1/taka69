"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { SupportChat } from "@/components/support/SupportChat";
import { PromoPopup } from "@/components/home/PromoPopup";
import { Headphones, Send, Facebook } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);

  return (
    <div className="jeta-shell mx-auto min-h-screen max-w-lg pb-28">
      <TopBar onMenu={() => setMenu(true)} onSupport={() => setSupport(true)} />
      <main className="px-3 py-3">{children}</main>
      <BottomNav />
      <SideDrawer open={menu} onClose={() => setMenu(false)} />
      <SupportChat open={support} onClose={() => setSupport(false)} floating={!support} />
      <PromoPopup />

      {/* JETA7-style floating social stack */}
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
