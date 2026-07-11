interface ArnOrdersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  view: "table" | "list";
  onViewChange: (value: "table" | "list") => void;
  onRefresh: () => void;
}

export default function ArnOrdersToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
  onRefresh,
}: ArnOrdersToolbarProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="relative">
        <i aria-hidden="true" className="ti ti-search absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--arn-txt-3)]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search client, fund, type or status"
          className="w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] py-2.5 pl-10 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)]"
        />
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--arn-bdr)] px-3 py-2 text-xs font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
        >
          <i aria-hidden="true" className="ti ti-refresh" />
          Refresh
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
