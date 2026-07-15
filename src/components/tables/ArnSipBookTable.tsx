import { usePathname, useRouter } from "next/navigation";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnSipBookItem, ArnSipBookStatus } from "@/types/arnSipBook";

interface ArnSipBookTableProps {
  sips: ArnSipBookItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function getStatusVariant(status: ArnSipBookStatus) {
  if (status === "active") return "active";
  if (status === "due-today") return "due";
  if (status === "paused") return "paused";
  return "failed";
}

function getNextSipClass(status: ArnSipBookStatus) {
  if (status === "at-risk") return "font-bold text-[var(--arn-red)]";
  if (status === "due-today") return "font-bold text-[var(--arn-amber)]";
  return "text-[var(--arn-txt-3)]";
}

export default function ArnSipBookTable({
  sips,
  total,
  page,
  pageSize,
  onPageChange,
}: ArnSipBookTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const goToClient = (clientId: string) => {
    const from = encodeURIComponent(`${pathname}?page=${page}`);
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
        <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-[20%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
              <th className="w-[26%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Amount</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Next SIP</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">XIRR</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {sips.map((sip) => (
              <tr
                key={sip.id}
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
