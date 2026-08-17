"use client";

import { useEffect } from "react";
import { useAuthBootstrap } from "@/hooks/useAuth";
import { useLangBootstrap } from "@/hooks/useLang";
import { useBrandBootstrap } from "@/hooks/useBrand";
import { useThemeBootstrap } from "@/hooks/useTheme";
import { ToastViewport } from "@/hooks/useToast";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useLangBootstrap();
  useBrandBootstrap();
  useThemeBootstrap();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }
  }, []);

  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
