"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { DEFAULT_BRAND, type BrandConfig } from "@/lib/brand";

type BrandState = {
  brand: BrandConfig;
  currency: string;
  loaded: boolean;
  setBrand: (b: Partial<BrandConfig> & { currency?: string }) => void;
  load: () => Promise<void>;
};

export const useBrandStore = create<BrandState>((set) => ({
  brand: DEFAULT_BRAND,
  currency: "BDT",
  loaded: false,
  setBrand: (b) =>
    set((s) => ({
      brand: { ...s.brand, ...b },
      currency: b.currency || s.currency,
    })),
  load: async () => {
    try {
      const res = await fetch("/api/site/brand", { credentials: "include" });
      const json = await res.json();
      if (json.ok && json.data?.brand) {
        set({
          brand: { ...DEFAULT_BRAND, ...json.data.brand },
          currency: json.data.currency || "BDT",
          loaded: true,
        });
        // live favicon + title
        if (typeof document !== "undefined") {
          const name = json.data.brand.siteName || "TAKA69";
          document.title = `${name} — Premium Play Money Casino`;
          const fav = json.data.brand.faviconUrl || "/icons/favicon-32.png";
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = fav;
        }
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));

export function useBrandBootstrap() {
  const load = useBrandStore((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
}

export function useBrand() {
  return useBrandStore((s) => s.brand);
}
