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
  onPageChange: (page: number) => void;
}

function getStatusVariant(status: ArnSipBookStatus) {
  if (status === "active") return "active";
  if (status === "inactive") return "inactive";
  if (status === "cancelled") return "cancelled";
  return "inactive";
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
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-[18%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
              <th className="w-[22%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
              <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Amount</th>
              <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Goal Amount</th>
              <th className="w-[10%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
              <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Next SIP</th>
              <th className="w-[8%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">XIRR</th>
              <th className="w-[12%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
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
                className="cursor-pointer transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]"
              >
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <ArnClientAvatar initials={sip.initials} tone={sip.tone} size="sm" />
                    <span className="truncate font-bold">{sip.clientName}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm text-[var(--arn-txt-3)]">{sip.fundName}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">{sip.amount}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">{sip.goalAmount}</td>
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
      <ArnPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  );
}
