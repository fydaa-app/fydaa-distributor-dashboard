import { cn } from "@/lib/utils";

interface ArnFilterPillProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export default function ArnFilterPill({ label, active = false, onClick }: ArnFilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded px-[11px] py-1 text-[11px] font-semibold whitespace-nowrap border border-[var(--arn-bdr-2)] transition-colors",
        active
          ? "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white"
          : "border-transparent bg-transparent text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)]"
      )}
    >
      {label}
    </button>
  );
}
