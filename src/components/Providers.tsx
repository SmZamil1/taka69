"use client";

import { useAuthBootstrap } from "@/hooks/useAuth";
import { useLangBootstrap } from "@/hooks/useLang";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useLangBootstrap();
  return <>{children}</>;
}
