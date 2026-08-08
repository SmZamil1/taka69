"use client";

import { useAuthBootstrap } from "@/hooks/useAuth";
import { useLangBootstrap } from "@/hooks/useLang";
import { ToastViewport } from "@/hooks/useToast";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useLangBootstrap();
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
