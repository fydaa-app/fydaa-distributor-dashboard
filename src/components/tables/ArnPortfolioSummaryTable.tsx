"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnPagination from "@/components/common/ArnPagination";
import type { ArnPortfolioSummaryRow } from "@/types/arnReports";

interface ArnPortfolioSummaryTableProps {
  clients: ArnPortfolioSummaryRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
}

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnPortfolioSummaryTable({
  clients,
  total,
  page,
  pageSize,
  onPageChange,
  search = "",
  onSearchChange,
  isLoading = false,
}: ArnPortfolioSummaryTableProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader
        title="Portfolio summary — all clients"
        action={
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-md border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] px-3 py-2 text-sm text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)] sm:w-64"
          />
        }
      />

      {isLoading ? (
        <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
          {skeletonRows.map((row) => (
            <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] p-4">
              <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
              <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <ArnEmptyState
          title="No portfolio data"
          description="Portfolio summary will appear once clients have holdings."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="w-[20%] border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Client</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Invested</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Current</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">P&L</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">XIRR</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">SIP / mo</th>
                  <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Updated</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:[&_td]:bg-[var(--arn-bg-2)]">
                    <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">
                      <div className="flex items-center gap-3">
                        <ArnClientAvatar initials={client.initials} tone={client.tone} size="sm" />
                        <span className="truncate font-bold">{client.name}</span>
                      </div>
                    </td>
                    <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{client.invested}</td>
                    <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{client.current}</td>
                    <td
                      className="border-b border-[var(--arn-bdr)] px-4 py-3 font-semibold"
                      style={{ color: client.pnlPositive ? "var(--arn-green)" : "var(--arn-red)" }}
                    >
                      {client.pnl}
                    </td>
                    <td
                      className="border-b border-[var(--arn-bdr)] px-4 py-3 font-semibold"
                      style={{ color: client.xirrPositive ? "var(--arn-green)" : "var(--arn-red)" }}
                    >
                      {client.xirr}
                    </td>
                    <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{client.sipMonthly}</td>
                    <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{client.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ArnPagination page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
        </>
      )}
    </div>
  );
}
