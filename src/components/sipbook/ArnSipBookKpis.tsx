"use client";

import ArnKpiCard from "@/components/common/ArnKpiCard";
import type { ArnSipBookKpis as ArnSipBookKpisData } from "@/types/arnSipBook";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

interface KpiConfig {
  label: string;
  value: string;
  trendText: string;
  tone: ArnTone;
  trend: "up" | "down" | "neutral";
  icon?: string;
}

interface ArnSipBookKpisProps {
  summary: ArnSipBookKpisData | null;
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
    label: "Cancelled SIPs",
    value: "cancelledSips",
    trendText: "needs reactivation",
    tone: "blue",
    trend: "neutral",
    icon: "ti ti-player-pause",
  },
];

export default function ArnSipBookKpis({ summary }: ArnSipBookKpisProps) {
  if (!summary) {
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

  const getValue = (key: string): string => {
    if (key === "totalSipBook") return summary.totalSipBook;
    if (key === "activeSips") return String(summary.activeSips);
    if (key === "atRiskSips") return String(summary.atRiskSips);
    if (key === "cancelledSips") return String(summary.cancelledSips);
    return "";
  };

  const newSips = summary.newSipsThisMonth ?? 0;
  const activeSipClients = summary.activeSipClients ?? 0;
  const atRisk = summary.atRiskSips ?? 0;

  const kpis = [
    {
      ...kpiConfigs[0],
      value: getValue("totalSipBook"),
      trendText: `+${newSips} SIPs this month`,
      trend: newSips > 0 ? ("up" as const) : ("neutral" as const),
      icon: newSips > 0 ? "ti ti-arrow-up" : "ti ti-equal",
    },
    {
      ...kpiConfigs[1],
      value: getValue("activeSips"),
      trendText: `across ${activeSipClients} clients`,
      trend: activeSipClients > 0 ? ("up" as const) : ("neutral" as const),
      icon: activeSipClients > 0 ? "ti ti-arrow-up" : "ti ti-equal",
    },
    {
      ...kpiConfigs[2],
      value: getValue("atRiskSips"),
      trendText: "No Activity",
      trend: atRisk > 0 ? ("down" as const) : ("neutral" as const),
      icon: atRisk > 0 ? "ti ti-arrow-down" : "ti ti-equal",
    },
    {
      ...kpiConfigs[3],
      value: getValue("cancelledSips"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {kpis.map((config) => (
        <ArnKpiCard
          key={config.label}
          label={config.label}
          value={config.value}
          trendText={config.trendText}
          tone={config.tone}
          trend={config.trend}
          icon={config.icon}
        />
      ))}
    </div>
  );
}
