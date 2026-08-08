"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { SupportChat } from "@/components/support/SupportChat";
import { PromoPopup } from "@/components/home/PromoPopup";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [support, setSupport] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-28">
      <TopBar onMenu={() => setMenu(true)} onSupport={() => setSupport(true)} />
      <main className="px-3 py-3">{children}</main>
      <BottomNav />
      <SideDrawer open={menu} onClose={() => setMenu(false)} />
      <SupportChat open={support} onClose={() => setSupport(false)} floating={!support} />
      <PromoPopup />
    </div>
  );
}
