import Link from "next/link";
import { useRouter } from "next/navigation";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnClient, ArnKycStatus } from "@/types/arnClient";

interface ArnClientTableProps {
  clients: ArnClient[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function getKycVariant(status: ArnKycStatus) {
  if (status === "done") return "active";
  if (status === "pending") return "due";
  if (status === "expired") return "failed";
  return "paused";
}

function getRowVariant(client: ArnClient) {
  return client.tone;
}

export default function ArnClientTable({
  clients,
  total,
  page,
  pageSize,
  onPageChange,
}: ArnClientTableProps) {
  const router = useRouter();

  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnEmptyState
          title="No clients found"
          description="Try changing your search to find the client you are looking for."
        />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-[24%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">AUM</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">SIP/mo</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">XIRR</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">KYC</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Last tx</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/arn-clients/${client.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/arn-clients/${client.id}`);
                  }
                }}
                className="cursor-pointer transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]"
              >
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                  <div className="flex items-center gap-3">
                    <ArnClientAvatar initials={client.initials} tone={getRowVariant(client)} size="md" />
                    <span className="truncate font-bold">{client.name}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{client.aum}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{client.sipMonthly}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3" style={{ color: client.xirr < 0 ? "var(--arn-red)" : "var(--arn-green)" }}>
                  {client.xirr.toFixed(1)}%
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                  <ArnStatusTag label={client.kycLabel} variant={getKycVariant(client.kycStatus)} />
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{client.lastTransactionLabel}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                  <Link
                    href={`/arn-share?clientId=${client.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="grid size-9 place-items-center rounded-[8px] border border-[var(--arn-bdr)] text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
                  >
                    <i aria-hidden="true" className="ti ti-send" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-[var(--arn-txt-3)]">
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
    </div>
  );
}
