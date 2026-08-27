import { usePathname, useRouter } from "next/navigation";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnOrderFilter, ArnOrderItem, ArnOrderStatus, ArnOrderType } from "@/types/arnOrders";

interface ArnOrdersTableProps {
  orders: ArnOrderItem[];
  total: number;
  page: number;
  pageSize: number;
  view: "table" | "list";
  filter: ArnOrderFilter;
  status: ArnOrderStatus | "all";
  onPageChange: (page: number) => void;
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
  filter,
  status,
  onPageChange,
}: ArnOrdersTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToClient = (clientId: string) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filter !== "all") params.set("filter", filter);
    if (status !== "all") params.set("status", status);
    const from = encodeURIComponent(`${pathname}?${params.toString()}`);
    router.push(`/arn-clients/${encodeURIComponent(clientId)}?from=${from}`);
  };

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
        <div className="-mx-5 overflow-x-auto">
          <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm [&_tbody_tr:nth-child(odd)]:bg-[var(--arn-bg-2)] [&_tbody_tr:nth-child(even)]:bg-[var(--arn-bg)]">
            <thead>
              <tr>
                <th className="w-[15%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
                <th className="w-[18%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
                <th className="w-[24%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Type</th>
                <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Order Amount</th>
                <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Processed Amount</th>
                <th className="w-[11%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Units</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:[&_td]:bg-[var(--arn-bg-2)]">
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <div className="text-[10px] font-semibold text-[var(--arn-txt-3)] sm:text-xs">{order.dateLabel}</div>
                    <div className="text-[10px] text-[var(--arn-txt-3)] sm:text-xs">{order.timeLabel}</div>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    <button
                      type="button"
                      onClick={() => goToClient(order.clientId)}
                      className="truncate text-left font-bold"
                    >
                      {order.clientShortName}
                    </button>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs text-[var(--arn-txt-3)] sm:text-sm">{order.fundName}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={order.typeLabel} variant={getTypeVariant(order.type)} size="task" />
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs font-bold text-[var(--arn-txt)] sm:text-sm">{order.orderAmount}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-xs font-bold text-[var(--arn-txt)] sm:text-sm">{order.processedAmount}</td>
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
                  <ArnClientAvatar initials={order.initials} size="md" />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => goToClient(order.clientId)}
                      className="truncate text-sm font-bold text-[var(--arn-txt)]"
                    >
                      {order.clientName}
                    </button>
                    <div className="mt-1 text-xs text-[var(--arn-txt-3)]">{order.dateLabel}</div>
                    <div className="text-[10px] text-[var(--arn-txt-3)] sm:text-xs">{order.timeLabel}</div>
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
                    <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Order Amount</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{order.orderAmount}</div>
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Processed Amount</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{order.processedAmount}</div>
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
