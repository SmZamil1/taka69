"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const LOAD_MS = 120_000; // 2 minutes

export default function ComingSoonGamePage() {
  const params = useParams();
  const code = String(params?.code || "");
  const t = useLang((s) => s.t);
  const [left, setLeft] = useState(LOAD_MS);
  const [meta, setMeta] = useState<{ nameEn?: string; nameBn?: string; cover?: string } | null>(null);

  useEffect(() => {
    fetch("/api/config", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const cat = j?.data?.gamesCatalog?.[code];
        if (cat) setMeta(cat);
      })
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const remain = Math.max(0, LOAD_MS - (Date.now() - start));
      setLeft(remain);
      if (remain <= 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const pct = useMemo(() => Math.min(100, ((LOAD_MS - left) / LOAD_MS) * 100), [left]);
  const done = left <= 0;
  const title = meta?.nameEn || code.replace(/_/g, " ");

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-[#05080a] text-white">
      <div className="pointer-events-auto absolute left-3 top-3 z-10">
        <Link
          href="/games"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back", "পেছনে")}
        </Link>
      </div>

      {meta?.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 text-center">
        {!done ? (
          <>
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-amber-300" />
            <div className="text-xl font-black">{title}</div>
            <div className="mt-2 text-sm text-white/55">
              {t("Loading game assets…", "গেম লোড হচ্ছে…")}
            </div>
            <div className="mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs tabular-nums text-white/40">
              {Math.ceil(left / 1000)}s
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 text-sm font-black uppercase tracking-widest text-amber-300/80">Coming Soon</div>
            <div className="text-2xl font-black text-amber-300">
              {t("Coming Soon", "শীঘ্রই আসছে")}
            </div>
            <div className="mt-2 max-w-sm text-sm text-white/60">
              {t(
                `${title} is being prepared. Check back later.`,
                `${title} প্রস্তুত হচ্ছে। পরে আবার দেখুন।`
              )}
            </div>
            <Link
              href="/games"
              className="mt-6 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-emerald-950"
            >
              {t("Back to games", "গেমসে ফিরুন")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
