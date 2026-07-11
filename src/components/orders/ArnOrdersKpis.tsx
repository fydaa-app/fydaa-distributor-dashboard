"use client";

import { useCallback, useEffect, useState } from "react";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import ArnErrorState from "@/components/common/ArnErrorState";
import { getArnOrdersKpis } from "@/services/arnOrdersService";
import type { ArnOrdersKpis } from "@/types/arnOrders";

const dummyKpis: ArnOrdersKpis = {
  ordersToday: 8,
  successfulToday: 6,
  processedJune: 147,
  transactedJuneInPaise: 2840000,
  failedOrders: 4,
  pendingOrders: 3,
};

function formatPaise(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function ArnOrdersKpis() {
  const [kpis, setKpis] = useState<ArnOrdersKpis>(dummyKpis);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setKpis(await getArnOrdersKpis());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load order KPIs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const cards = [
    {
      label: "Orders today",
      value: String(kpis.ordersToday),
      trendText: `${kpis.successfulToday} successful`,
      tone: "amber" as const,
      trend: "up" as const,
    },
    {
      label: "Processed (Jun)",
      value: String(kpis.processedJune),
      trendText: formatPaise(kpis.transactedJuneInPaise),
      tone: "green" as const,
      trend: "up" as const,
    },
    {
      label: "Failed orders",
      value: String(kpis.failedOrders),
      trendText: "action needed",
      tone: "red" as const,
      trend: "down" as const,
    },
    {
      label: "Pending",
      value: String(kpis.pendingOrders),
      trendText: "processing",
      tone: "blue" as const,
      trend: "neutral" as const,
    },
  ];

  return error ? (
    <ArnErrorState
      title="Could not load order summary"
      message={error}
      retry={loadKpis}
    />
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={isLoading ? "animate-pulse rounded-[14px] bg-[var(--arn-bg)] p-5" : undefined}>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-3 w-28 rounded bg-[var(--arn-bg-2)]" />
              <div className="h-9 w-32 rounded bg-[var(--arn-bg-2)]" />
              <div className="h-4 w-36 rounded bg-[var(--arn-bg-2)]" />
            </div>
          ) : (
            <ArnKpiCard {...card} />
          )}
        </div>
      ))}
    </div>
  );
}
