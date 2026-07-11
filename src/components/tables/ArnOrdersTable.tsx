import Link from "next/link";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnOrderItem, ArnOrderStatus, ArnOrderType } from "@/types/arnOrders";

interface ArnOrdersTableProps {
  orders: ArnOrderItem[];
  total: number;
  page: number;
  pageSize: number;
  view: "table" | "list";
  onPageChange: (page: number) => void;
  onAction: (order: ArnOrderItem) => void;
}

function getStatusVariant(status: ArnOrderStatus) {
  if (status === "done") return "active";
  if (status === "processing") return "processing";
  if (status === "pending") return "pending";
  return "failed";
}

function getTypeVariant(type: ArnOrderType) {
  if (type === "sip") return "processing";
  if (type === "lumpsum") return "valuation";
  if (type === "redemption") return "teal";
  return "review";
}

export default function ArnOrdersTable({
  orders,
  total,
  page,
  pageSize,
  view,
  onPageChange,
  
}: ArnOrdersTableProps) {
  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnEmptyState
          title="No orders found"
          description="Try changing your search, filter or status."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
                <th className="w-[18%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
                <th className="w-[26%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Type</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Amount</th>
                <th className="w-[9%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Units</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="group hover:[&_td]:bg-[var(--arn-bg-2)]">
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[10px] font-semibold text-[var(--arn-txt-3)] sm:text-xs">{order.dateLabel}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    <Link href={`/arn-clients/${encodeURIComponent(order.clientId)}`} className="flex min-w-0 items-center gap-3">
                      <ArnClientAvatar initials={order.initials} tone={order.tone} size="sm" />
                      <span className="truncate font-bold">{order.clientShortName}</span>
                    </Link>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs text-[var(--arn-txt-3)] sm:text-sm">{order.fundName}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={order.typeLabel} variant={getTypeVariant(order.type)} size="task" />
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs font-bold text-[var(--arn-txt)] sm:text-sm">{order.amount}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs text-[var(--arn-txt-3)] sm:text-sm">{order.units}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={order.statusLabel} variant={getStatusVariant(order.status)} size="task" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ArnClientAvatar initials={order.initials} tone={order.tone} size="md" />
                  <div className="min-w-0">
                    <Link href={`/arn-clients/${encodeURIComponent(order.clientId)}`} className="truncate text-sm font-bold text-[var(--arn-txt)]">
                      {order.clientName}
                    </Link>
                    <div className="mt-1 text-xs text-[var(--arn-txt-3)]">{order.dateLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArnStatusTag label={order.typeLabel} variant={getTypeVariant(order.type)} size="task" />
                  <ArnStatusTag label={order.statusLabel} variant={getStatusVariant(order.status)} size="task" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--arn-txt-3)] sm:grid-cols-4 sm:text-sm">
                <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Fund</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{order.fundName}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Amount</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{order.amount}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Units</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{order.units}</div>
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
