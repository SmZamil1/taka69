import { cn } from "@/lib/utils";

type AccountCardProps = { title?: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string };

export function AccountCard({ title, subtitle, icon, action, children, className }: AccountCardProps) {
  return <section className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-[0_7px_22px_color-mix(in_srgb,var(--header)_12%,transparent)]", className)}>
    {(title || icon || action) ? <div className="mb-3 flex items-start gap-2">
      {icon ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fb] text-[#2675bd]">{icon}</span> : null}
      {title ? <div className="min-w-0 flex-1"><h2 className="text-sm font-black">{title}</h2>{subtitle ? <p className="mt-0.5 text-[10px] text-[#7690a8]">{subtitle}</p> : null}</div> : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div> : null}
    {children}
  </section>;
}
