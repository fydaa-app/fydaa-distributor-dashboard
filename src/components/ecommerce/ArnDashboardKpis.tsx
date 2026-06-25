"use client";

import ArnKpiCard from "@/components/common/ArnKpiCard";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

interface DashboardKpi {
  label: string;
  value: string;
  trendText: string;
  tone: ArnTone;
  trend: "up" | "down" | "neutral";
}

const kpis: DashboardKpi[] = [
  {
    label: "Total AUM",
    value: "₹4.2 Cr",
    trendText: "+8.4% this month",
    tone: "amber",
    trend: "up",
  },
  {
    label: "SIP book / mo",
    value: "₹3.8 L",
    trendText: "+12 new SIPs",
    tone: "green",
    trend: "up",
  },
  {
    label: "Trail earned (May)",
    value: "₹34,200",
    trendText: "+6.1% vs Apr",
    tone: "blue",
    trend: "up",
  },
  {
    label: "SIPs at risk",
    value: "3",
    trendText: "NACH pending",
    tone: "red",
    trend: "down",
  },
];

export default function ArnDashboardKpis() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <ArnKpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
