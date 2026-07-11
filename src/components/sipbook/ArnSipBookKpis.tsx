"use client";

import { useCallback, useEffect, useState } from "react";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import ArnErrorState from "@/components/common/ArnErrorState";
import { getArnSipBookKpis } from "@/services/arnSipBookService";
import type { ArnSipBookKpis as ArnSipBookKpisData } from "@/types/arnSipBook";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

interface KpiConfig {
  label: string;
  value: keyof ArnSipBookKpisData;
  trendText: string;
  tone: ArnTone;
  trend: "up" | "down" | "neutral";
  icon?: string;
}

const kpiConfigs: KpiConfig[] = [
  {
    label: "Total SIP book",
    value: "totalSipBook",
    trendText: "+12 SIPs this month",
    tone: "amber",
    trend: "up",
  },
  {
    label: "Active SIPs",
    value: "activeSips",
    trendText: "across 38 clients",
    tone: "green",
    trend: "up",
  },
  {
    label: "At-risk SIPs",
    value: "atRiskSips",
    trendText: "NACH failure",
    tone: "red",
    trend: "down",
  },
  {
    label: "Paused SIPs",
    value: "pausedSips",
    trendText: "needs reactivation",
    tone: "blue",
    trend: "neutral",
    icon: "ti ti-player-pause",
  },
];

function formatValue(key: keyof ArnSipBookKpisData, data: ArnSipBookKpisData): string {
  if (key === "activeSips" || key === "atRiskSips" || key === "pausedSips") {
    return String(data[key]);
  }

  return data.totalSipBook;
}

export default function ArnSipBookKpis() {
  const [data, setData] = useState<ArnSipBookKpisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await getArnSipBookKpis());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load SIP book KPIs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
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
          title="Could not load SIP book KPIs"
          message={error || "No SIP book data is available."}
          retry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {kpiConfigs.map((config) => (
        <ArnKpiCard
          key={config.label}
          label={config.label}
          value={formatValue(config.value, data)}
          trendText={config.trendText}
          tone={config.tone}
          trend={config.trend}
          icon={config.icon}
        />
      ))}
    </div>
  );
}
