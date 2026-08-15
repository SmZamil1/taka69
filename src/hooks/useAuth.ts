"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type AuthUser = {
  id: string;
  username: string;
  role: string;
  balance: number;
  vipLevel: number;
  avatar?: string | null;
  /** Custom staff feature keys (SUPPORT/MODERATOR). Empty/null = role defaults. */
  permissions?: string[] | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  setBalance: (b: number) => void;
  setLoading: (l: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setBalance: (balance) =>
    set((s) => (s.user ? { user: { ...s.user, balance } } : {})),
  setLoading: (loading) => set({ loading }),
}));

export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setUser(j.data);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
