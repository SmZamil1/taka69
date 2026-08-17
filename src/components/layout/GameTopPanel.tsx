"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Gamepad2, Gift, Home, Search, Star, WalletCards } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { formatCoins, cn } from "@/lib/utils";

const TITLES: Record<string, [string, string]> = {
  aviator: ["Aviator", "এভিয়েটর"],
  crash: ["Crash", "ক্র্যাশ"],
  crash2: ["Crash 2", "ক্র্যাশ ২"],
  dice: ["Dice", "ডাইস"],
  hilo: ["Hi-Lo", "হাই-লো"],
  mines: ["Mines", "মাইনস"],
  plinko: ["Plinko", "প্লিনকো"],
  slots: ["Slots", "স্লটস"],
  wheel: ["Wheel", "হুইল"],
  "cherry-charm": ["Cherry Charm", "চেরি চার্ম"],
  "fortune-maya": ["Fortune Maya", "ফরচুন মায়া"],
  "extreme-plinko": ["Extreme Plinko", "এক্সট্রিম প্লিনকো"],
  "mystical-forest": ["Mystical Forest", "মিস্টিক্যাল ফরেস্ট"],
  "pixi-slots": ["Pixi Slots", "পিক্সি স্লটস"],
};

function gameTitle(path: string, lang: "en" | "bn") {
  const key = path.split("/")[2] || "games";
  const pair = TITLES[key] || [key.replace(/[-_]/g, " "), key.replace(/[-_]/g, " ")];
  return lang === "bn" ? pair[1] : pair[0];
}

export function GameTopPanel() {
  const path = usePathname() || "/games";
  const user = useAuthStore((s) => s.user);
  const lang = useLang((s) => s.lang);
  const [open, setOpen] = useState(false);
  const title = gameTitle(path, lang);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] pt-safe">
      <div className="pointer-events-auto mx-auto max-w-lg px-2.5 pt-2">
        <div className={cn("game-top-panel", open && "is-open")}>
          <div className="game-top-panel-main">
            <Link href="/games" className="game-top-panel-brand" aria-label="Games">
              <Gamepad2 className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate text-[13px] font-black text-[var(--ink-strong)]">{title}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">TAKA69 play</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="game-top-panel-arrow"
              aria-label={open ? "Hide game panel" : "Show game panel"}
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className="game-top-panel-balance">
              <span className="text-[9px] text-[var(--muted)]">৳</span>
              <span>{user ? formatCoins(user.balance) : "0.00"}</span>
            </div>
          </div>
          {open && (
            <div className="game-top-panel-short">
              <Link href="/games" className="game-top-panel-action"><Home className="h-4 w-4" /><span>{lang === "bn" ? "গেমস" : "Games"}</span></Link>
              <Link href="/games?fav=1" className="game-top-panel-action"><Star className="h-4 w-4" /><span>{lang === "bn" ? "পছন্দ" : "Favorites"}</span></Link>
              <Link href="/wallet" className="game-top-panel-action"><WalletCards className="h-4 w-4" /><span>{lang === "bn" ? "ওয়ালেট" : "Wallet"}</span></Link>
              <Link href="/promotions" className="game-top-panel-action"><Gift className="h-4 w-4" /><span>{lang === "bn" ? "বোনাস" : "Bonus"}</span></Link>
              <Link href="/games" className="game-top-panel-action"><Search className="h-4 w-4" /><span>{lang === "bn" ? "খুঁজুন" : "Search"}</span></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
