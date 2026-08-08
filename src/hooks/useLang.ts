"use client";

import { create } from "zustand";
import { useEffect } from "react";

type Lang = "bn" | "en";

type LangState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, bn: string) => string;
};

export const useLang = create<LangState>((set, get) => ({
  lang: "bn",
  setLang: (lang) => {
    if (typeof window !== "undefined") localStorage.setItem("taka69_lang", lang);
    set({ lang });
  },
  t: (en, bn) => (get().lang === "bn" ? bn : en),
}));

export function useLangBootstrap() {
  const setLang = useLang((s) => s.setLang);
  useEffect(() => {
    const saved = localStorage.getItem("taka69_lang") as Lang | null;
    if (saved === "en" || saved === "bn") setLang(saved);
  }, [setLang]);
}
