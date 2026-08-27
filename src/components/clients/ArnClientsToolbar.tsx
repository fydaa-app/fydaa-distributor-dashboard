interface ArnClientsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  view?: "table" | "list";
  onViewChange?: (value: "table" | "list") => void;
}

export default function ArnClientsToolbar({ search, onSearchChange, view, onViewChange }: ArnClientsToolbarProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <i aria-hidden="true" className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--arn-txt-3)]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search clients"
            className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-12 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
          />
        </div>
        {onViewChange && (
          <div className="flex items-center justify-end">
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
        )}
      </div>
    </div>
  );
}

function cnViewButton(active: boolean): string {
  return `grid h-10 w-10 place-items-center text-[var(--arn-txt-2)] transition-colors ${
    active ? "bg-[var(--arn-amber)] text-white" : "hover:bg-[var(--arn-bg)]"
  }`;
}
