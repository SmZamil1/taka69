"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Wallet, X } from "lucide-react";

const GAME_PATHS = ["/games", "/wingo", "/game_aviator"];

/**
 * After login, if balance < 1 BDT and user opens any game, force deposit popup.
 */
export function DepositGate() {
  const user = useAuthStore((s) => s.user);
  const t = useLang((s) => s.t);
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isGame =
    GAME_PATHS.some((p) => path === p || path.startsWith(p + "/")) ||
    path.startsWith("/games/");

  useEffect(() => {
    if (!user || !isGame) {
      setOpen(false);
      return;
    }
    if ((user.balance ?? 0) < 1) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, user?.balance, isGame, path]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#0d4a30] to-[#062016] shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/");
          }}
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-white">
            {t("Deposit required", "ডিপোজিট প্রয়োজন")}
          </h3>
          <p className="text-sm text-emerald-100/75 leading-relaxed">
            {t(
              "Your balance is less than ৳1. Please deposit to play any game.",
              "আপনার ব্যালেন্স ৳১ এর কম। যেকোনো গেম খেলতে ডিপোজিট করুন।"
            )}
          </p>
          <div className="text-xs text-white/40">
            {t("Current balance", "বর্তমান ব্যালেন্স")}: ৳{Number(user.balance || 0).toFixed(2)}
          </div>
          <Link
            href="/wallet?tab=deposit"
            className="block w-full rounded-2xl bg-gradient-to-b from-amber-300 to-yellow-500 py-3.5 text-sm font-black text-emerald-950 shadow-lg"
            onClick={() => setOpen(false)}
          >
            {t("Deposit now", "এখনই ডিপোজিট")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/");
            }}
            className="text-xs font-semibold text-white/50"
          >
            {t("Back to home", "হোমে ফিরুন")}
          </button>
        </div>
      </div>
    </div>
  );
}
