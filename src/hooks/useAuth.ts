"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type AuthUser = {
  id: string;
  username: string;
  balance: number;
  role: string;
  referralCode?: string;
  avatar?: string | null;
  lastDailyAt?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  setBalance: (n: number) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setBalance: (balance) =>
    set((s) => (s.user ? { user: { ...s.user, balance } } : s)),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      if (json.ok) set({ user: json.data, loading: false });
      else set({ user: null, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await fetch("/api/auth/me", { method: "DELETE", credentials: "include" });
    set({ user: null });
  },
}));

export function useAuthBootstrap() {
  const refresh = useAuthStore((s) => s.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
}
