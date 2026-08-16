import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountRowProps = { icon: LucideIcon; title: string; description?: string; value?: string; badge?: string; href?: string; onClick?: () => void; disabled?: boolean; className?: string };

export function AccountRow({ icon: Icon, title, description, value, badge, href, onClick, disabled, className }: AccountRowProps) {
  const content = <><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", disabled ? "bg-white/5 text-emerald-100/30" : "bg-emerald-400/15 text-mint-300")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className={cn("block truncate text-sm font-bold", disabled ? "text-emerald-100/35" : "text-emerald-50")}>{title}</span>{description ? <span className="mt-0.5 block truncate text-[10px] text-emerald-100/50">{description}</span> : null}</span>{value ? <span className="shrink-0 text-xs font-bold text-emerald-100/65">{value}</span> : null}{badge ? <span className="shrink-0 rounded-full border border-gold-300/20 bg-gold-300/10 px-2 py-1 text-[10px] font-black text-gold-300">{badge}</span> : null}{!disabled ? <ChevronRight className="h-4 w-4 shrink-0 text-emerald-100/40" /> : null}</>;
  const classes = cn("flex min-h-16 w-full items-center gap-3 border-b border-emerald-100/10 py-2.5 last:border-0", disabled ? "cursor-not-allowed opacity-75" : "transition hover:bg-emerald-400/[0.04] active:scale-[0.99]", className);
  if (href && !disabled) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={classes}>{content}</button>;
}
