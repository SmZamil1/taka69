import { cn } from "@/lib/utils";

type AccountCardProps = { title?: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string };

export function AccountCard({ title, subtitle, icon, action, children, className }: AccountCardProps) {
  return (
    <section className={cn("rounded-[1.35rem] border border-emerald-100/10 bg-gradient-to-br from-[#0d3025]/90 to-[#071a14]/90 p-4 text-emerald-50 shadow-card", className)}>
      {(title || icon || action) ? (
        <div className="mb-3 flex items-start gap-2">
          {icon ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-mint-300 ring-1 ring-emerald-200/10">{icon}</span> : null}
          {title ? <div className="min-w-0 flex-1"><h2 className="text-sm font-black">{title}</h2>{subtitle ? <p className="mt-0.5 text-[10px] text-emerald-100/55">{subtitle}</p> : null}</div> : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
