"use client";

import { useCallback, useEffect, useState } from "react";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import ArnErrorState from "@/components/common/ArnErrorState";
import { getArnCommissionKpis } from "@/services/arnCommissionService";
import type { ArnCommissionKpis } from "@/types/arnCommission";

const dummyKpis: ArnCommissionKpis = {
  trailMay: "₹34,200",
  trailMayInPaise: 34200,
  fy26Total: "₹3.42 L",
  fy26TotalInPaise: 342000,
  effectiveTrailRate: "0.82%",
  trendText: "+6.1% vs Apr",
};

export default function ArnCommissionKpis() {
  const [kpis, setKpis] = useState<ArnCommissionKpis>(dummyKpis);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setKpis(await getArnCommissionKpis());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load commission KPIs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const cards = [
    {
      label: "Trail (May 2026)",
      value: kpis.trailMay,
      trendText: kpis.trendText,
      tone: "amber" as const,
      trend: "up" as const,
    },
    {
      label: "FY26 total earned",
      value: kpis.fy26Total,
      trendText: "On track",
      tone: "green" as const,
      trend: "up" as const,
    },
    {
      label: "Effective trail %",
      value: kpis.effectiveTrailRate,
      trendText: "vs 0.75% last yr",
      tone: "blue" as const,
      trend: "up" as const,
    },
  ];

  return error ? (
    <ArnErrorState
      title="Could not load commission summary"
      message={error}
      retry={loadKpis}
    />
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
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
