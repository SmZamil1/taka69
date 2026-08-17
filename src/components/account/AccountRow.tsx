import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountRowProps = { icon: LucideIcon; title: string; description?: string; value?: string; badge?: string; href?: string; onClick?: () => void; disabled?: boolean; className?: string };

export function AccountRow({ icon: Icon, title, description, value, badge, href, onClick, disabled, className }: AccountRowProps) {
  const content = <><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", disabled ? "bg-slate-100 text-slate-400" : "bg-[#e8f2fb] text-[#2675bd]")}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><span className={cn("block truncate text-sm font-bold", disabled ? "text-slate-400" : "text-[#294765]")}>{title}</span>{description ? <span className="mt-0.5 block truncate text-[10px] text-[#8ba0b3]">{description}</span> : null}</span>{value ? <span className="shrink-0 text-xs font-bold text-[#68839d]">{value}</span> : null}{badge ? <span className="shrink-0 rounded-full bg-[#fff1dc] px-2 py-1 text-[10px] font-black text-[#e28a18]">{badge}</span> : null}{!disabled ? <ChevronRight className="h-4 w-4 shrink-0 text-[#9bb0c3]" /> : null}</>;
  const classes = cn("flex min-h-14 w-full items-center gap-3 border-b border-[#edf2f7] py-2.5 last:border-0", disabled ? "cursor-not-allowed opacity-75" : "transition active:scale-[0.99]", className);
  if (href && !disabled) return <Link href={href} className={classes}>{content}</Link>;
  return <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={classes}>{content}</button>;
}
