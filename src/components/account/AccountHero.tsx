import { ShieldCheck, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PROFILE_AVATAR } from "@/lib/profile-avatar";

type AccountHeroProps = {
  username?: string | null;
  avatar?: string | null;
  balance?: string | number | null;
  badge?: string;
  eyebrow?: string;
  description?: string;
  progress?: number;
  progressLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

export function AccountHero({ username, avatar, balance, badge, eyebrow, description, progress, progressLabel, className, children }: AccountHeroProps) {
  const safeProgress = Math.min(100, Math.max(0, progress ?? 0));
  return (
    <section className={cn("relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#123d2a] via-[#176b4a] to-[#2eaf78] p-4 text-white shadow-[0_14px_30px_rgba(8,42,27,0.32)]", className)}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-12 h-36 w-48 rounded-full bg-cyan-200/15 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white/70 bg-white/20 bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${avatar || DEFAULT_PROFILE_AVATAR})` }} role="img" aria-label={username ? `${username} profile picture` : "Profile picture"} />
        <div className="min-w-0 flex-1">
          {eyebrow ? <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100/75">{eyebrow}</div> : null}
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-black">{username || "অতিথি"}</h2>
            {badge ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">{badge}</span> : null}
          </div>
          {description ? <p className="mt-0.5 truncate text-[11px] text-blue-50/75">{description}</p> : null}
        </div>
      </div>
      {balance !== undefined ? (
        <div className="relative mt-4 flex items-end justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-50/70"><WalletCards className="h-3.5 w-3.5" /> ব্যালেন্স</div>
            <div className="mt-0.5 text-xl font-black">৳ {balance ?? "0"}</div>
          </div>
          <ShieldCheck className="h-7 w-7 text-white/75" />
        </div>
      ) : null}
      {progress !== undefined ? (
        <div className="relative mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-bold text-blue-50/80"><span>{progressLabel || "অগ্রগতি"}</span><span>{Math.round(safeProgress)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]" style={{ width: `${safeProgress}%` }} /></div>
        </div>
      ) : null}
      {children ? <div className="relative mt-3">{children}</div> : null}
    </section>
  );
}
