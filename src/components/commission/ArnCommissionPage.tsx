"use client";

import { useCallback, useEffect, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnAmcSplitChart from "@/components/ecommerce/ArnAmcSplitChart";
import ArnTrailTrendChart from "@/components/ecommerce/ArnTrailTrendChart";
// import ArnCommissionFilters from "@/components/commission/ArnCommissionFilters";
// import ArnCommissionToolbar from "@/components/commission/ArnCommissionToolbar";
import ArnCommissionKpis from "@/components/commission/ArnCommissionKpis";
import ArnCommissionLedgerTable from "@/components/tables/ArnCommissionLedgerTable";
import { getArnCommission } from "@/services/arnCommissionService";
import type { ArnCommissionLedgerItem, ArnCommissionSortKey, ArnCommissionStatus } from "@/types/arnCommission";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnCommissionPage() {
const [search] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

const [status] = useState<ArnCommissionStatus | "all">("all");
const [month] = useState("");
const [sortKey] = useState<ArnCommissionSortKey>("month");
const [sortDirection] = useState<"asc" | "desc">("desc");
const [view] = useState<"table" | "list">("table");
  const [page, setPage] = useState(1);
  const [ledger, setLedger] = useState<ArnCommissionLedgerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);
  
  const loadLedger = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getArnCommission({
        search: debouncedSearch,
        status,
        month,
        page,
        pageSize: 5,
        sortKey,
        sortDirection,
      });

      setLedger(response.ledger);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load commission ledger.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, month, page, sortDirection, sortKey, status]);
  
  useEffect(() => {
    loadLedger();
  }, [loadLedger]);
  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, month, status]);
  
  useEffect(() => {
    if (!actionMessage) return undefined;
    const timeout = window.setTimeout(() => setActionMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);
  
  const handleAction = (item: ArnCommissionLedgerItem) => {
    setActionMessage(`${item.actionLabel} started for ${item.month}.`);
  };

  const handleExport = () => {
    setActionMessage("Commission export generated with dummy data.");
  };
  
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnCommissionKpis />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnTrailTrendChart />
        <ArnAmcSplitChart />
      </div>

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title="Commission ledger">
          {/* Removed filters */}
          {/* Removed toolbar */}
          <button
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[var(--arn-amber)] outline-none"
          >
            <i className="ti ti-download" />
            Export
          </button>
        </ArnCardHeader>

        {error ? (
          <ArnErrorState
            title="Could not load commission ledger"
            message={error}
            retry={loadLedger}
          />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No commission records found"
              description="Try changing your search, status or month."
            />
          </div>
        ) : (
          <ArnCommissionLedgerTable
            ledger={ledger}
            total={total}
            page={page}
            pageSize={5}
            view={view}
            onPageChange={setPage}
            onAction={handleAction}
          />
        )}

        {actionMessage && (
          <div className="mt-4 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">
            {actionMessage}
          </div>
        )}
      </div>
    </div>
  );
}
