import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnCommissionLedgerItem, ArnCommissionStatus } from "@/types/arnCommission";

interface ArnCommissionLedgerTableProps {
  ledger: ArnCommissionLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
  view: "table" | "list";
  onPageChange: (page: number) => void;
  onAction: (item: ArnCommissionLedgerItem) => void;
}

function getStatusVariant(status: ArnCommissionStatus) {
  if (status === "paid") return "active";
  if (status === "processing") return "processing";
  if (status === "pending") return "pending";
  return "failed";
}

export default function ArnCommissionLedgerTable({
  ledger,
  total,
  page,
  pageSize,
  view,
  onPageChange,
}: ArnCommissionLedgerTableProps) {
  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnEmptyState
          title="No commission records found"
          description="Try changing your search, status or month filter."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      {view === "table" ? (
        <div className="-mx-5 overflow-x-auto">
          <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm [&_tbody_tr:nth-child(odd)]:bg-[var(--arn-bg-2)] [&_tbody_tr:nth-child(even)]:bg-[var(--arn-bg)]">
            <thead>
              <tr>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Month</th>
                <th className="w-[16%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">AUM (avg)</th>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">Trail</th>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">Upfront</th>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">Total</th>
                <th className="w-[13%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item) => (
                <tr key={item.id} className="transition-colors">
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm font-bold text-[var(--arn-txt)]">{item.month}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm text-[var(--arn-txt-3)]">{item.aum}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-sm text-[var(--arn-txt)]">{item.trail}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-sm text-[var(--arn-txt)]">{item.upfront}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-sm font-black text-[var(--arn-txt)]">{item.total}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={item.statusLabel} variant={getStatusVariant(item.status)} size="task" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {ledger.map((item) => (
            <div key={item.id} className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-[var(--arn-txt)]">{item.month}</div>
                  <div className="mt-1 text-xs text-[var(--arn-txt-3)]">Avg AUM {item.aum}</div>
                </div>
                <ArnStatusTag label={item.statusLabel} variant={getStatusVariant(item.status)} size="task" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--arn-txt-3)] sm:grid-cols-4 sm:text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Trail</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{item.trail}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Upfront</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{item.upfront}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Total</div>
                  <div className="mt-1 font-black text-[var(--arn-txt)]">{item.total}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ArnPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  );
}
