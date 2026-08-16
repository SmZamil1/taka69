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
        body: JSON.stringify({
          idToken,
          referralCode:
            new URLSearchParams(window.location.search).get("ref") ||
            new URLSearchParams(window.location.search).get("referral") ||
            undefined,
        }),
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
            email: json.data.email,
            phone: json.data.phone,
            needsOnboarding: json.data.needsOnboarding,
            role: json.data.role,
            balance: json.data.balance,
            vipLevel: json.data.vipLevel,
            avatar: json.data.avatar,
          });
          const currentParams = new URLSearchParams(window.location.search);
          const referralCode = currentParams.get("ref") || currentParams.get("referral") || "";
          const requestedNext = currentParams.get("next") || "/";
          const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
          if (json.data.needsOnboarding) {
            const onboardingUrl = `/onboarding?${new URLSearchParams({ ...(referralCode ? { ref: referralCode } : {}), next }).toString()}`;
            router.push(onboardingUrl);
          } else {
            router.push(next);
          }
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-[#7891a8]">
        <div className="h-px flex-1 bg-[#d6e3ef]" />
        {t("or continue with", "অথবা চালিয়ে যান")}
        <div className="h-px flex-1 bg-[#d6e3ef]" />
      </div>

      {clientId ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#d6e3ef] bg-white p-1 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white to-slate-50" />
          <div ref={btnRef} className="relative z-[1] flex min-h-[48px] items-center justify-center" />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#d6e3ef] bg-[#f8fbfe] px-4 py-3 text-center">
          <p className="text-sm font-bold text-[#294766]">
            {t("Google sign-in is not configured here", "এই সাইটে Google sign-in সেটআপ করা নেই")}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#7891a8]">
            {t(
              "Use your username, email, or phone to sign in, or ask the site administrator to configure Google OAuth.",
              "ইউজারনেম, ইমেইল বা ফোন দিয়ে লগইন করুন, অথবা সাইট অ্যাডমিনকে Google OAuth সেটআপ করতে বলুন।"
            )}
          </p>
        </div>
      )}
      {clientId && !ready && (
        <p className="text-center text-[11px] text-[#7891a8]">{t("Loading Google…", "Google লোড হচ্ছে…")}</p>
      )}
      {error && <p role="alert" className="text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
