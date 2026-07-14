"use client";

import { useCallback, useEffect, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnSipBookFilters from "@/components/sipbook/ArnSipBookFilters";
import ArnSipBookHealth from "@/components/sipbook/ArnSipBookHealth";
import ArnSipBookKpis from "@/components/sipbook/ArnSipBookKpis";
import ArnSipBookToolbar from "@/components/sipbook/ArnSipBookToolbar";
import ArnSipBookTrendChart from "@/components/sipbook/ArnSipBookTrendChart";
import ArnSipBookTable from "@/components/tables/ArnSipBookTable";
import { fetchSipBook } from "@/services/arnSipBookService";
import type {
  ArnSipBookFilter,
  ArnSipBookHealthData,
  ArnSipBookItem,
  ArnSipBookKpis as ArnSipBookKpisType,
  ArnSipBookTrendPoint,
} from "@/types/arnSipBook";

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnSipBookPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ArnSipBookFilter>("all");
  const [page, setPage] = useState(1);
  const [trendPeriod, setTrendPeriod] = useState<"6M" | "1Y">("6M");

  const [sips, setSips] = useState<ArnSipBookItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ArnSipBookKpisType | null>(null);
  const [filterCounts, setFilterCounts] = useState<Record<string, number> | null>(null);
  const [health, setHealth] = useState<ArnSipBookHealthData | null>(null);
  const [inflowTrend, setInflowTrend] = useState<ArnSipBookTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSipBook({
        search: debouncedSearch,
        status,
        page,
        pageSize: 5,
        sortKey: "nextSipDate",
        sortDirection: "asc",
        type: "individual",
        trendPeriod,
      });

      setSips(result.sips);
      setTotal(result.total);
      setSummary(result.summary);
      setHealth(result.health);
      setInflowTrend(result.inflowTrend);
      setFilterCounts(result.filterCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load SIP book.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, status, trendPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, trendPeriod]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnSipBookKpis summary={summary} />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <ArnSipBookTrendChart inflowTrend={inflowTrend} trendPeriod={trendPeriod} onPeriodChange={setTrendPeriod} />
        <ArnSipBookHealth health={health} />
      </div>

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title="All SIPs">
          <ArnSipBookFilters active={status} onChange={setStatus} filterCounts={filterCounts} />
        </ArnCardHeader>

        <div className="mb-5">
          <ArnSipBookToolbar search={search} onSearchChange={setSearch} />
        </div>

        {error ? (
          <ArnErrorState
            title="Could not load SIP book"
            message={error}
            retry={loadData}
          />
        ) : isLoading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
            <ArnEmptyState
              title="No SIPs found"
              description="Try changing your search or status filter."
            />
          </div>
        ) : (
          <ArnSipBookTable
            sips={sips}
            total={total}
            page={page}
            pageSize={5}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
