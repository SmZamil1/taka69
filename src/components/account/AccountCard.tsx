import { cn } from "@/lib/utils";

type AccountCardProps = { id?: string; title?: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string };

export function AccountCard({ id, title, subtitle, icon, action, children, className }: AccountCardProps) {
  return <section id={id} className={cn("rounded-2xl border border-[color-mix(in_srgb,var(--line)_92%,var(--accent))] bg-[var(--surface-raised)] p-4 text-[var(--ink)] shadow-[0_7px_22px_rgba(0,0,0,0.18)]", className)}>
    {(title || icon || action) ? <div className="mb-3 flex items-start gap-2">
      {icon ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface-muted))] text-[var(--accent-strong)]">{icon}</span> : null}
      {title ? <div className="min-w-0 flex-1"><h2 className="text-sm font-black">{title}</h2>{subtitle ? <p className="mt-0.5 text-[10px] text-[var(--muted)]">{subtitle}</p> : null}</div> : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div> : null}
    {children}
  </section>;
}
