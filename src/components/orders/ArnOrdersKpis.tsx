"use client";

import ArnKpiCard from "@/components/common/ArnKpiCard";
import ArnErrorState from "@/components/common/ArnErrorState";
import type { ArnOrdersKpis } from "@/types/arnOrders";

function formatPaise(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

interface ArnOrdersKpisProps {
  kpis: ArnOrdersKpis | null;
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
}

export default function ArnOrdersKpis({ kpis, isLoading, error, retry }: ArnOrdersKpisProps) {
  const cards = [
    {
      label: "Orders today",
      value: String(kpis?.ordersToday ?? 0),
      trendText: `${kpis?.successfulToday ?? 0} successful`,
      tone: "amber" as const,
      trend: "up" as const,
    },
    {
      label: "Processed (Jun)",
      value: String(kpis?.processedJune ?? 0),
      trendText: formatPaise(kpis?.transactedJuneInPaise ?? 0),
      tone: "green" as const,
      trend: "up" as const,
    },
    {
      label: "Failed orders",
      value: String(kpis?.failedOrders ?? 0),
      trendText: "action needed",
      tone: "red" as const,
      trend: "down" as const,
    },
    {
      label: "Pending",
      value: String(kpis?.pendingOrders ?? 0),
      trendText: "processing",
      tone: "blue" as const,
      trend: "neutral" as const,
      icon: "ti ti-clock",
    },
  ];

  return error ? (
    <ArnErrorState
      title="Could not load order summary"
      message={error}
      retry={retry}
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
