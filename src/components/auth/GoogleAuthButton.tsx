"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

/**
 * Google Sign-In button (GIS).
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in env.
 */
export function GoogleAuthButton({ mode = "login" }: { mode?: "login" | "register" }) {
  const t = useLang((s) => s.t);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data.googleClientId) setClientId(j.data.googleClientId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId || !btnRef.current) return;

    function handleCredential(response: { credential?: string }) {
      const idToken = response.credential;
      if (!idToken) return;
      setError("");
      fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (!json.ok) {
            setError(json.error || "Google login failed");
            return;
          }
          setUser({
            id: json.data.id,
            username: json.data.username,
            role: json.data.role,
            balance: json.data.balance,
            vipLevel: json.data.vipLevel,
            avatar: json.data.avatar,
          });
          if (json.data.needsOnboarding) router.push("/onboarding");
          else router.push("/");
        })
        .catch(() => setError("Network error"));
    }

    const existing = document.getElementById("google-gis");
    const init = () => {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        ux_mode: "popup",
      });
      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: mode === "register" ? "signup_with" : "continue_with",
        shape: "pill",
      });
      setReady(true);
    };

    if (existing) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.id = "google-gis";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [clientId, mode, router, setUser]);

  if (!clientId) {
    return (
      <p className="text-center text-[10px] text-white/30">
        {t(
          "Google login: set NEXT_PUBLIC_GOOGLE_CLIENT_ID",
          "Google লগইন: NEXT_PUBLIC_GOOGLE_CLIENT_ID সেট করুন"
        )}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] text-white/35">
        <div className="h-px flex-1 bg-white/10" />
        {t("or", "অথবা")}
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div ref={btnRef} className="flex justify-center min-h-[44px]" />
      {!ready && (
        <p className="text-center text-[11px] text-white/40">{t("Loading Google…", "Google লোড…")}</p>
      )}
      {error && <p className="text-center text-xs text-rose-400">{error}</p>}
    </div>
  );
}
