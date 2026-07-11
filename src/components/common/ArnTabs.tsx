import { cn } from "@/lib/utils";

interface ArnTab {
  id: string;
  label: string;
}

interface ArnTabsProps {
  tabs: ArnTab[];
  active: string;
  onChange: (id: string) => void;
}

export default function ArnTabs({ tabs, active, onChange }: ArnTabsProps) {
  return (
    <div className="mb-3 flex border-b border-[var(--arn-bdr)]" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "border-b-2 border-transparent px-[14px] py-2 text-sm font-semibold text-[var(--arn-txt-2)]",
            active === tab.id && "border-[var(--arn-amber)] font-bold text-[var(--arn-txt)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
