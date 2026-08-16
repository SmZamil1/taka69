import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function AccountHeader({ title, subtitle, backHref = "/profile", right, icon: Icon = ArrowLeft, className }: AccountHeaderProps) {
  return (
    <header className={cn("-mx-3 -mt-3 flex min-h-16 items-center gap-3 border-b border-emerald-100/10 bg-[#071c15]/90 px-4 py-3 text-emerald-50 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl", className)}>
      <Link href={backHref} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100/10 bg-emerald-100/[0.07] text-mint-200 transition hover:bg-emerald-400/15 active:scale-95">
        <Icon className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-black tracking-tight">{title}</h1>
        {subtitle ? <p className="truncate text-[10px] font-medium text-emerald-100/55">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
