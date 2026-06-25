"use client";

import { useCallback, useEffect, useState } from "react";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import ArnErrorState from "@/components/common/ArnErrorState";
import { getArnShareKpis } from "@/services/arnShareService";
import type { ArnShareKpis } from "@/types/arnShare";

export default function ArnShareKpis() {
  const [data, setData] = useState<ArnShareKpis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await getArnShareKpis());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load share KPIs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="animate-pulse rounded-[14px] bg-[var(--arn-bg)] p-5">
            <div className="mb-3 h-3 w-28 rounded bg-[var(--arn-bg-2)]" />
            <div className="mb-3 h-9 w-32 rounded bg-[var(--arn-bg-2)]" />
            <div className="h-4 w-36 rounded bg-[var(--arn-bg-2)]" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnErrorState
          title="Could not load share KPIs"
          message={error || "No share data is available."}
          retry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
      <ArnKpiCard
        label="Reports shared (Jun)"
        value={String(data.reportsShared)}
        trendText={data.reportsSharedTrend}
        tone="amber"
        trend="up"
        icon="ti ti-trending-up"
      />
      <ArnKpiCard
        label="Viewed by clients"
        value={String(data.viewedByClients)}
        trendText={data.viewedRate}
        tone="green"
        trend="up"
        icon="ti ti-eye"
      />
      <ArnKpiCard
        label="WhatsApp sends"
        value={String(data.whatsappSends)}
        trendText={data.whatsappLabel}
        tone="blue"
        trend="neutral"
        icon="ti ti-message"
      />
    </div>
  );
}
