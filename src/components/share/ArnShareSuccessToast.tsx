interface ArnShareSuccessToastProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export default function ArnShareSuccessToast({ title, message, onDismiss }: ArnShareSuccessToastProps) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-4 py-3 shadow-sm">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--arn-green-bg)]">
        <i aria-hidden="true" className="ti ti-check text-[var(--arn-green)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[var(--arn-txt)]">{title}</div>
        <div className="text-xs text-[var(--arn-txt-2)]">{message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-[var(--arn-bdr)] text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
      >
        <i aria-hidden="true" className="ti ti-x" />
      </button>
    </div>
  );
}
