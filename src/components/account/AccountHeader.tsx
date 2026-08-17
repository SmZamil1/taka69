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
    <header className={cn("-mx-3 -mt-3 flex min-h-14 items-center gap-3 bg-[#102b57] px-4 py-3 text-white shadow-[0_5px_18px_rgba(16,43,87,0.22)]", className)}>
      <Link href={backHref} aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-white/15 active:scale-95">
        <Icon className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-black tracking-tight">{title}</h1>
        {subtitle ? <p className="truncate text-[10px] font-medium text-blue-100/70">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}
