interface ArnSipBookToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function ArnSipBookToolbar({ search, onSearchChange }: ArnSipBookToolbarProps) {
  return (
    <div className="relative">
      <i aria-hidden="true" className="ti ti-search absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--arn-txt-3)]" />
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search client, fund or status"
        className="w-full rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] py-2.5 pl-10 pr-4 text-sm font-semibold text-[var(--arn-txt)] outline-none transition-colors placeholder:text-[var(--arn-txt-3)] focus:border-[var(--arn-amber)]"
      />
    </div>
  );
}
