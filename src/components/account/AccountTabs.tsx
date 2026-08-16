import { cn } from "@/lib/utils";

type AccountTab = { id: string; label: string; count?: string | number };
type AccountTabsProps = { tabs: AccountTab[]; value: string; onChange: (value: string) => void; className?: string };

export function AccountTabs({ tabs, value, onChange, className }: AccountTabsProps) {
  return (
    <div className={cn("flex gap-1 rounded-xl bg-[#dce8f4] p-1", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(tab.id)} className={cn("flex-1 rounded-lg px-2 py-2 text-xs font-black transition active:scale-[0.98]", active ? "bg-[#1f70c1] text-white shadow-sm" : "text-[#53708d] hover:bg-white/70")}>{tab.label}{tab.count !== undefined ? <span className="ml-1 opacity-70">{tab.count}</span> : null}</button>;
      })}
    </div>
  );
}
