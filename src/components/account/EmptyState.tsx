import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = { title: string; description?: string; icon?: LucideIcon; action?: React.ReactNode; className?: string };

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return <div className={cn("flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#cbdbea] bg-[#f8fbfe] px-4 py-6 text-center", className)}>
    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f1fa] text-[#7d9bb6]"><Icon className="h-5 w-5" /></span>
    <p className="text-sm font-black text-[#4a6680]">{title}</p>
    {description ? <p className="mt-1 max-w-xs text-[11px] leading-5 text-[#8ba0b3]">{description}</p> : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>;
}
