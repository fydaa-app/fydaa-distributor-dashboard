"use client";

import type { ArnDashboardSummary } from "@/types/arnDashboard";
import ArnKpiCard from "@/components/common/ArnKpiCard";

type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal" | "gray";

interface DashboardKpi {
  label: string;
  value: string;
  trendText: string;
  tone: ArnTone;
  trend: "up" | "down" | "neutral";
  icon?: string;
}

function formatCr(value: number): string {
  const cr = value / 10000000;
  return `₹${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
}

function formatL(value: number): string {
  const l = value / 100000;
  return `₹${l.toFixed(2).replace(/\.00$/, "")} L`;
}

function formatRupee(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function buildSummaryKpis(summary: ArnDashboardSummary): DashboardKpi[] {
  const aumChange = summary.totalAumChangePercent;
  const aumUp = aumChange > 0;
  const aumDown = aumChange < 0;

  const sipUp = summary.newSips > 0;

  const trailChange = summary.trailEarnedChangePercent;
  const trailUp = trailChange > 0;
  const trailDown = trailChange < 0;

  return [
    {
      label: "Total AUM",
      value: formatCr(summary.totalAum),
      trendText: `${aumChange >= 0 ? "+" : ""}${aumChange.toFixed(1)}%`,
      tone: "amber",
      trend: aumUp ? "up" : aumDown ? "down" : "neutral",
      icon: aumUp ? "ti ti-arrow-up" : aumDown ? "ti ti-arrow-down" : "ti ti-equal",
    },
    {
      label: "SIP book / mo",
      value: formatL(summary.sipBookMonthly),
      trendText: `+${summary.newSips} new SIPs`,
      tone: "green",
      trend: sipUp ? "up" : "neutral",
      icon: sipUp ? "ti ti-arrow-up" : "ti ti-equal",
    },
    {
      label: `Trail earned (${summary.trailEarnedPeriod})`,
      value: formatRupee(summary.trailEarned),
      trendText: `${trailChange >= 0 ? "+" : ""}${trailChange.toFixed(1)}% vs prev`,
      tone: "blue",
      trend: trailUp ? "up" : trailDown ? "down" : "neutral",
      icon: trailUp ? "ti ti-arrow-up" : trailDown ? "ti ti-arrow-down" : "ti ti-equal",
    },
    {
      label: "SIPs at risk",
      value: String(summary.sipsAtRisk),
      trendText: "NACH pending",
      tone: "red",
      trend: "down",
    },
  ];
}

interface ArnDashboardKpisProps {
  summary: ArnDashboardSummary;
}

export default function ArnDashboardKpis({ summary }: ArnDashboardKpisProps) {
  const kpis = buildSummaryKpis(summary);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <ArnKpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
