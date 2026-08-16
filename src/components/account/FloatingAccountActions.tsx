"use client";

import { ChevronUp, X } from "lucide-react";
import { useEffect, useState } from "react";

type FloatingAccountActionsProps = { onClose?: () => void; showClose?: boolean };

export function FloatingAccountActions({ onClose, showClose = true }: FloatingAccountActionsProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 180);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-3 z-30 flex flex-col gap-2">
      {showClose ? <button type="button" onClick={onClose || (() => window.history.back())} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#102b57]/90 text-white shadow-lg ring-2 ring-white/70 backdrop-blur transition active:scale-95" aria-label="Close"><X className="h-4 w-4" /></button> : null}
      {visible ? <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8bd55] text-[#102b57] shadow-lg ring-2 ring-[#ffe9a8]/80 transition active:scale-95" aria-label="Scroll to top"><ChevronUp className="h-5 w-5" /></button> : null}
    </div>
  );
}
