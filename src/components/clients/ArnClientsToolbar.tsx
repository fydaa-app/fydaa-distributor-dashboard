interface ArnClientsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function ArnClientsToolbar({ search, onSearchChange }: ArnClientsToolbarProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="relative">
        <i aria-hidden="true" className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--arn-txt-3)]" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search clients"
          className="h-12 w-full rounded-[10px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] pl-12 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)]"
        />
      </div>
    </div>
  );
}
