import { usePathname, useRouter } from "next/navigation";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnSipBookFilter, ArnSipBookItem, ArnSipBookStatus } from "@/types/arnSipBook";

interface ArnSipBookTableProps {
  sips: ArnSipBookItem[];
  total: number;
  page: number;
  pageSize: number;
  status: ArnSipBookFilter;
  view: "table" | "list";
  onPageChange: (page: number) => void;
}

function getStatusVariant(status: ArnSipBookStatus) {
  if (status === "active") return "active";
  if (status === "inactive") return "pending";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function getNextSipClass(status: ArnSipBookStatus) {
  if (status === "active") return "font-bold text-[var(--arn-green)]";
  if (status === "inactive") return "text-[var(--arn-txt-3)]";
  if (status === "cancelled") return "text-[var(--arn-txt-3)]";
  return "text-[var(--arn-txt-3)]";
}

export default function ArnSipBookTable({
  sips,
  total,
  page,
  pageSize,
  status,
  view,
  onPageChange,
}: ArnSipBookTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToClient = (clientId: string) => {
    const query = status === "all" ? `page=${page}` : `page=${page}&status=${status}`;
    const from = encodeURIComponent(`${pathname}?${query}`);
    router.push(`/arn-clients/${encodeURIComponent(clientId)}?from=${from}`);
  };

  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnEmptyState
          title="No SIPs found"
          description="Try changing your search or SIP status filter."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      {view === "table" ? (
        <div className="-mx-5 overflow-x-auto">
          <table className="min-w-[860px] w-full table-fixed border-collapse text-left text-sm [&_tbody_tr:nth-child(odd)]:bg-[var(--arn-bg-2)] [&_tbody_tr:nth-child(even)]:bg-[var(--arn-bg)] [&_tbody_tr:nth-child(odd):hover]:bg-[var(--arn-amber-sel-bg)] [&_tbody_tr:nth-child(even):hover]:bg-[var(--arn-amber-sel-bg)]">
            <thead>
              <tr>
                <th className="w-[22%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
                <th className="w-[28%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Sip Amount</th>
                <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
                <th className="w-[14%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Next SIP</th>
                <th className="w-[8%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">XIRR</th>
                <th className="w-[14%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {sips.map((sip) => (
                <tr
                  key={`${sip.id}-${sip.planId}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToClient(sip.clientId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      goToClient(sip.clientId);
                    }
                  }}
                   className="cursor-pointer transition-colors"
                >
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                    <span className="truncate font-bold">{sip.clientName}</span>
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm text-[var(--arn-txt-3)]">{sip.fundName}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">{sip.amount}</td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm text-[var(--arn-txt-3)]">{sip.sipDayLabel}</td>
                  <td className={`border-b border-[var(--arn-bdr)] px-4 py-3 text-sm ${getNextSipClass(sip.status)}`}>
                    {sip.nextSipLabel}
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm" style={{ color: sip.xirr < 0 ? "var(--arn-red)" : "var(--arn-green)" }}>
                    {sip.xirr.toFixed(1)}%
                  </td>
                  <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                    <ArnStatusTag label={sip.statusLabel} variant={getStatusVariant(sip.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {sips.map((sip) => (
            <div
              key={`${sip.id}-${sip.planId}`}
              role="button"
              tabIndex={0}
              onClick={() => goToClient(sip.clientId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goToClient(sip.clientId);
                }
              }}
               className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] p-4 text-left transition-colors hover:bg-[var(--arn-amber-sel-bg)] cursor-pointer sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ArnClientAvatar initials={sip.initials} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[var(--arn-txt)]">{sip.clientName}</div>
                    <div className="mt-1 text-xs text-[var(--arn-txt-3)]">{sip.fundName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArnStatusTag label={sip.statusLabel} variant={getStatusVariant(sip.status)} size="task" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--arn-txt-3)] sm:grid-cols-4 sm:text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">SIP Amount</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{sip.amount}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Date</div>
                  <div className="mt-1 font-bold text-[var(--arn-txt)]">{sip.sipDayLabel}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">Next SIP</div>
                  <div className={`mt-1 font-bold ${getNextSipClass(sip.status)}`}>{sip.nextSipLabel}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--arn-txt-3)] sm:text-sm">XIRR</div>
                  <div className="mt-1 font-bold" style={{ color: sip.xirr < 0 ? "var(--arn-red)" : "var(--arn-green)" }}>{sip.xirr.toFixed(1)}%</div>
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
