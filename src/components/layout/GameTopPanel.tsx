"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Gift,
  Heart,
  Home,
  Maximize2,
  Minimize2,
  Search,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  wingo: ["Wingo", "উইঙ্গো"],
};

function gameKey(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[0] === "games" ? parts[1] || "games" : parts[0] || "games";
}

function gameTitle(path: string, lang: "en" | "bn") {
  const key = gameKey(path);
  const pair = TITLES[key] || [key.replace(/[-_]/g, " "), key.replace(/[-_]/g, " ")];
  return lang === "bn" ? pair[1] : pair[0];
}

const FAVORITES_KEY = "taka69_fav_games";

export function GameTopPanel() {
  const path = usePathname() || "/games";
  const user = useAuthStore((s) => s.user);
  const lang = useLang((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const key = useMemo(() => gameKey(path), [path]);
  const title = gameTitle(path, lang);
  const isBn = lang === "bn";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      setFavorite(Array.isArray(saved) && saved.includes(key));
    } catch {
      setFavorite(false);
    }
  }, [key]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFavorite() {
    setFavorite((current) => {
      const next = !current;
      try {
        const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
        const favorites = new Set<string>(Array.isArray(saved) ? saved : []);
        if (next) favorites.add(key);
        else favorites.delete(key);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
      } catch {
        /* localStorage may be unavailable in private browsing. */
      }
      return next;
    });
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await (panelRef.current?.closest(".jeta-shell") || document.documentElement).requestFullscreen?.();
    } catch {
      /* Mobile browsers may block fullscreen until a stronger gesture. */
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] pt-safe">
      <div className="pointer-events-auto mx-auto max-w-lg px-2 pt-2">
        <div ref={panelRef} className={cn("game-top-panel", open && "is-open")}>
          <div className="game-top-panel-main">
            <Link href="/games" className="game-top-panel-brand" aria-label={isBn ? "গেমস" : "Games"}>
              <Gamepad2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="game-top-panel-arrow"
              aria-label={open ? (isBn ? "প্যানেল বন্ধ করুন" : "Hide game panel") : (isBn ? "প্যানেল দেখান" : "Show game panel")}
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className="game-top-panel-right">
              <div className="game-top-panel-balance" aria-label={`${formatCoins(user?.balance)} BDT`}>
                <span className="game-top-panel-balance-value">{formatCoins(user?.balance)}</span>
                <span className="game-top-panel-balance-currency">BDT</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="game-top-panel-menu"
                aria-label={isBn ? "মেনু" : "Menu"}
              >
                ☰
              </button>
            </div>
          </div>

          {open && (
            <>
              <div className="game-top-panel-wallet">
                <div className="game-top-panel-wallet-pill">
                  <WalletCards className="h-4 w-4" />
                  <span>৳ {formatCoins(user?.balance)}</span>
                  <small>BDT</small>
                </div>
                <div className="game-top-panel-wallet-actions">
                  <Link href="/wallet?tab=deposit" className="game-top-panel-deposit">DEPOSIT</Link>
                  <Link href="/promotions" className="game-top-panel-gift" aria-label={isBn ? "প্রমোশন" : "Promotions"}>
                    <Gift className="h-5 w-5" />
                    <span>1</span>
                  </Link>
                </div>
              </div>
              <div className="game-top-panel-tools">
                <Link href="/games" className="game-top-panel-tool"><ArrowLeft /><span>{isBn ? "পিছনে" : "Back"}</span></Link>
                <button type="button" onClick={toggleFavorite} className={cn("game-top-panel-tool", favorite && "is-favorite")}>
                  <Heart className={cn(favorite && "fill-current")} /><span>{favorite ? (isBn ? "সংরক্ষিত" : "Favorited") : (isBn ? "ফেভারিট যোগ" : "Add Favorite")}</span>
                </button>
                <Link href="/games?fav=1" className="game-top-panel-tool"><Heart /><span>{isBn ? "আমার ফেভারিট" : "My favorites"}</span></Link>
                <Link href="/games" className="game-top-panel-tool"><Search /><span>{isBn ? "খুঁজুন" : "Search"}</span></Link>
                <Link href="/" className="game-top-panel-tool"><Home /><span>{isBn ? "হোম" : "Home"}</span></Link>
                <button type="button" onClick={toggleFullscreen} className="game-top-panel-tool">
                  {fullscreen ? <Minimize2 /> : <Maximize2 />}<span>{isBn ? "ফুলস্ক্রিন" : "Fullscreen"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
