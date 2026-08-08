"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string }) => void;
  remove: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
};

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = t.id || Math.random().toString(36).slice(2, 10);
    set((s) => ({ toasts: [...s.toasts.slice(-4), { ...t, id }] }));
    setTimeout(() => get().remove(id), 4200);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  success: (title, message) => get().push({ kind: "success", title, message }),
  error: (title, message) => get().push({ kind: "error", title, message }),
  info: (title, message) => get().push({ kind: "info", title, message }),
  warning: (title, message) => get().push({ kind: "warning", title, message }),
}));

const styles: Record<ToastKind, string> = {
  success: "border-emerald-400/40 bg-emerald-950/95 text-emerald-50",
  error: "border-rose-400/40 bg-rose-950/95 text-rose-50",
  info: "border-sky-400/40 bg-sky-950/95 text-sky-50",
  warning: "border-amber-400/40 bg-amber-950/95 text-amber-50",
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastViewport() {
  const toasts = useToast((s) => s.toasts);
  const remove = useToast((s) => s.remove);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-2xl backdrop-blur-xl animate-[slideDown_0.25s_ease]",
              styles[t.kind]
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{t.title}</div>
              {t.message && (
                <div className="mt-0.5 text-xs opacity-80 leading-relaxed">{t.message}</div>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="rounded-lg p-1 opacity-60 hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export function useToastBootstrap() {
  // reserved for future global listeners
  useEffect(() => {}, []);
}
