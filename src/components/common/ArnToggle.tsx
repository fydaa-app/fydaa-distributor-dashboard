import { cn } from "@/lib/utils";

interface ArnToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export default function ArnToggle({ checked, onChange, label, id }: ArnToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4 w-7 shrink-0 rounded-full transition-colors",
        checked ? "bg-[var(--arn-amber)]" : "border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-3)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-3 rounded-full transition-all",
          checked ? "left-3.5 bg-white" : "left-0.5 bg-[var(--arn-txt-3)]"
        )}
      />
    </button>
  );
}
