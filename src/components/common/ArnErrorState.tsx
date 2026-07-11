interface ArnErrorStateProps {
  title: string;
  message: string;
  retry?: () => void;
  action?: React.ReactNode;
}

export default function ArnErrorState({ title, message, retry, action }: ArnErrorStateProps) {
  return (
    <div className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-red-bg)]/60 p-6 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--arn-bg)] text-[22px] text-[var(--arn-red)]">
        <i aria-hidden="true" className="ti ti-alert-triangle" />
      </div>
      <h3 className="text-sm font-bold text-[var(--arn-txt)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--arn-txt-2)]">{message}</p>
      {(retry || action) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="rounded-[8px] border border-[var(--arn-bdr-2)] bg-[var(--arn-bg)] px-4 py-2 text-xs font-bold text-[var(--arn-txt)] transition-colors hover:bg-[var(--arn-bg-2)]"
            >
              Retry
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
