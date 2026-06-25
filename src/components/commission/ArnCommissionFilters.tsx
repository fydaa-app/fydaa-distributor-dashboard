import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnCommissionStatus } from "@/types/arnCommission";

interface ArnCommissionFiltersProps {
  activeStatus: ArnCommissionStatus | "all";
  activeMonth: string;
  onStatusChange: (status: ArnCommissionStatus | "all") => void;
  onMonthChange: (month: string) => void;
}

const statuses: Array<{ label: string; value: ArnCommissionStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

const months = [
  { label: "All months", value: "" },
  { label: "Jun 2026", value: "2026-06" },
  { label: "May 2026", value: "2026-05" },
  { label: "Apr 2026", value: "2026-04" },
  { label: "Mar 2026", value: "2026-03" },
];

export default function ArnCommissionFilters({
  activeStatus,
  activeMonth,
  onStatusChange,
  onMonthChange,
}: ArnCommissionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <ArnFilterPill
            key={status.value}
            label={status.label}
            active={activeStatus === status.value}
            onClick={() => onStatusChange(status.value)}
          />
        ))}
      </div>
      <select
        value={activeMonth}
        onChange={(event) => onMonthChange(event.target.value)}
        className="h-8 rounded-[20px] border border-[var(--arn-bdr-2)] bg-transparent px-3 py-1 text-[11px] font-semibold text-[var(--arn-txt-2)] outline-none transition-colors focus:border-[var(--arn-amber)]"
      >
        {months.map((month) => (
          <option key={month.value || "all"} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
    </div>
  );
}
