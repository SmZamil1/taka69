"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "taka69_theme";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle("theme-dark", mode === "dark");
  root.classList.toggle("theme-light", mode === "light");
  root.classList.toggle("theme-auto", mode === "auto");
}

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

export const useTheme = create<ThemeState>((set) => ({
  theme: "auto",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, theme);
      applyTheme(theme);
    }
    set({ theme });
  },
}));

export function useThemeBootstrap() {
  const setTheme = useTheme((s) => s.setTheme);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const theme: ThemeMode = saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
    applyTheme(theme);
    if (useTheme.getState().theme !== theme) setTheme(theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useTheme.getState().theme === "auto") applyTheme("auto");
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [setTheme]);
}

