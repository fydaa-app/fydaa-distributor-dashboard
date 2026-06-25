import type { ArnCommissionSortKey } from "@/types/arnCommission";

interface ArnCommissionToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: ArnCommissionSortKey;
  sortDirection: "asc" | "desc";
  view: "table" | "list";
  onSortKeyChange: (value: ArnCommissionSortKey) => void;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onViewChange: (value: "table" | "list") => void;
  onExport: () => void;
}

const sortOptions: Array<{ label: string; value: ArnCommissionSortKey }> = [
  { label: "Month", value: "month" },
  { label: "AUM", value: "aum" },
  { label: "Trail", value: "trail" },
  { label: "Upfront", value: "upfront" },
  { label: "Total", value: "total" },
  { label: "Status", value: "status" },
];

export default function ArnCommissionToolbar({
  search,
  onSearchChange,
  sortKey,
  sortDirection,
  view,
  onSortKeyChange,
  onSortDirectionChange,
  onViewChange,
  onExport,
}: ArnCommissionToolbarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
      <div className="relative">
        <i aria-hidden="true" className="ti ti-search absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--arn-txt-3)]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search month, AUM or status"
          className="w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] py-2.5 pl-10 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)]"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as ArnCommissionSortKey)}
          className="h-10 rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-3 text-xs font-bold text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Toggle sort direction"
          onClick={() => onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
          className="grid h-10 w-10 place-items-center rounded-[10px] border border-[var(--arn-bdr)] text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
        >
          <i aria-hidden="true" className={sortDirection === "asc" ? "ti ti-arrow-up" : "ti ti-arrow-down"} />
        </button>
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--arn-bdr)] px-3 py-2 text-xs font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
        >
          <i aria-hidden="true" className="ti ti-download" />
          Export
        </button>
        <div className="inline-flex overflow-hidden rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)]">
          <button
            type="button"
            onClick={() => onViewChange("table")}
            className={cnViewButton(view === "table")}
          >
            <i aria-hidden="true" className="ti ti-table" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={cnViewButton(view === "list")}
          >
            <i aria-hidden="true" className="ti ti-list" />
          </button>
        </div>
      </div>
    </div>
  );
}

function cnViewButton(active: boolean): string {
  return `grid h-10 w-10 place-items-center text-[var(--arn-txt-2)] transition-colors ${
    active ? "bg-[var(--arn-amber)] text-white" : "hover:bg-[var(--arn-bg)]"
  }`;
}
