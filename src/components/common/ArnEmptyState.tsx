interface ArnEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function ArnEmptyState({ title, description, action }: ArnEmptyStateProps) {
  return (
    <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-6 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--arn-bg)] text-[22px] text-[var(--arn-amber)]">
        <i aria-hidden="true" className="ti ti-inbox" />
      </div>
      <h3 className="text-sm font-bold text-[var(--arn-txt)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--arn-txt-2)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
