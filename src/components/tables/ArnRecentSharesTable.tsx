"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnRecentShare } from "@/types/arnShare";

interface ArnRecentSharesTableProps {
  shares: ArnRecentShare[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onResend: (share: ArnRecentShare) => void;
  resendingId?: string | null;
}

function getChannelIcon(channel: ArnRecentShare["channel"]) {
  if (channel === "whatsapp") return "ti ti-message";
  if (channel === "email") return "ti ti-mail";
  if (channel === "copy-link") return "ti ti-link";
  return "ti ti-download";
}

export default function ArnRecentSharesTable({
  shares,
  total,
  page,
  pageSize,
  onPageChange,
  onResend,
  resendingId,
}: ArnRecentSharesTableProps) {
  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnEmptyState
          title="No shares yet"
          description="Reports you send to clients will appear here."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Recent shares" />

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-[20%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Report type</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Channel</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Sent on</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Viewed</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {shares.map((share) => (
              <tr key={share.id} className="transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]">
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                  <div className="flex items-center gap-3">
                    <ArnClientAvatar initials={share.initials} tone={share.tone} size="sm" />
                    <span className="truncate font-bold">{share.clientShortName}</span>
                  </div>
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{share.reportType}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-2)]">
                  <span className="inline-flex items-center gap-1.5">
                    <i aria-hidden="true" className={getChannelIcon(share.channel)} />
                    {share.channelLabel}
                  </span>
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{share.sentOn}</td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                  <ArnStatusTag label={share.viewed ? "Yes" : "No"} variant={share.viewed ? "active" : "paused"} />
                </td>
                <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onResend(share)}
                    disabled={resendingId === share.id}
                    className={`inline-flex items-center gap-1 rounded-[8px] border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      share.viewed
                        ? "border-[var(--arn-bdr)] text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)]"
                        : "border-[var(--arn-amber)] bg-[var(--arn-amber)] text-white hover:opacity-90"
                    }`}
                  >
                    <i aria-hidden="true" className={share.viewed ? "ti ti-refresh" : "ti ti-send"} />
                    {resendingId === share.id ? "Sending..." : share.viewed ? "Resend" : "Send again"}
                  </button>
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
