"use client";

import { create } from "zustand";
import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  body?: string;
  duration?: number;
};

type ToastState = {
  toasts: Toast[];
  add: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

let _idCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => {
    const id = `toast_${++_idCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, t.duration ?? 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Hook — use inside any client component */
export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    success: (title: string, body?: string) => add({ variant: "success", title, body }),
    error:   (title: string, body?: string) => add({ variant: "error",   title, body }),
    info:    (title: string, body?: string) => add({ variant: "info",    title, body }),
    warning: (title: string, body?: string) => add({ variant: "warning", title, body }),
  };
}

/** Rendered viewport — include once in Providers */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  const colors: Record<ToastVariant, string> = {
    success: "border-emerald-500/40 bg-emerald-900/90",
    error:   "border-rose-500/40 bg-rose-900/90",
    info:    "border-blue-500/40 bg-blue-900/90",
    warning: "border-amber-500/40 bg-amber-900/90",
  };
  const icons: Record<ToastVariant, string> = {
    success: "✓", error: "✕", info: "ℹ", warning: "⚠",
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={
            `pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all cursor-pointer ${colors[t.variant]}`
          }
        >
          <span className="mt-0.5 text-sm font-black text-white/80">{icons[t.variant]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white">{t.title}</div>
            {t.body && <div className="mt-0.5 text-xs text-white/70">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
