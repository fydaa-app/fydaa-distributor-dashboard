interface ArnPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ArnPagination({ page, total, pageSize, onPageChange }: ArnPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="mt-3 flex items-center gap-1 text-[10px] text-[var(--arn-txt-3)]">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        <i aria-hidden="true" className="ti ti-chevron-left" />
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="disabled:cursor-not-allowed disabled:opacity-40"
      >
        <i aria-hidden="true" className="ti ti-chevron-right" />
      </button>
      <span className="ml-2">Showing {start} of {end}</span>
    </div>
  );
}
