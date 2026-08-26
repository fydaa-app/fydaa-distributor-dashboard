"use client";

import { useCallback, useEffect, useState } from "react";
import ArnDashboardKpis from "@/components/ecommerce/ArnDashboardKpis";
import ArnAumTrendChart from "@/components/ecommerce/ArnAumTrendChart";
import ArnSipBookList from "@/components/ecommerce/ArnSipBookList";
import ArnTopClientsCard from "@/components/ecommerce/ArnTopClientsCard";
import ArnTaskWidget from "@/components/ecommerce/ArnTaskWidget";
import { getArnDashboard } from "@/services/arnDashboardService";
import type { ArnDashboardAumTrend, ArnDashboardResponse, ArnDashboardSipBookItem, ArnDashboardSummary, ArnDashboardTopClient } from "@/types/arnDashboard";

export default function ArnDashboard() {
  const [summary, setSummary] = useState<ArnDashboardSummary | null>(null);
  const [aumTrend, setAumTrend] = useState<ArnDashboardAumTrend[]>([]);
  const [sipBook, setSipBook] = useState<ArnDashboardSipBookItem[]>([]);
  const [topClients, setTopClients] = useState<ArnDashboardTopClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data: ArnDashboardResponse = await getArnDashboard();
      setSummary(data.summary);
      setAumTrend(data.aumTrend);
      setSipBook(data.sipBook);
      setTopClients(data.topClientsByAum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-[12px] bg-[var(--arn-bg-2)]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 text-sm text-red-500">
          {error}
        </div>
      ) : summary ? (
        <ArnDashboardKpis summary={summary} />
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        {isLoading ? (
          <>
            <div className="h-[300px] animate-pulse rounded-[16px] bg-[var(--arn-bg-2)]" />
            <div className="h-[300px] animate-pulse rounded-[16px] bg-[var(--arn-bg-2)]" />
          </>
        ) : error ? null : (
          <>
            <ArnAumTrendChart aumTrend={aumTrend} />
            <ArnSipBookList sipBook={sipBook} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <div className="h-[200px] animate-pulse rounded-[16px] bg-[var(--arn-bg-2)]" />
            <div className="h-[200px] animate-pulse rounded-[16px] bg-[var(--arn-bg-2)]" />
          </>
        ) : error ? null : (
          <>
            <ArnTopClientsCard topClients={topClients} />
            <ArnTaskWidget />
          </>
        )}
      </div>
    </div>
  );
}