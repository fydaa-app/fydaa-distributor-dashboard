"use client";

import ArnErrorState from "@/components/common/ArnErrorState";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import type { ArnClientsKpis as ArnClientsKpisData } from "@/types/arnClient";

interface ArnClientsKpisProps {
  summary: ArnClientsKpisData | null;
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
}

function formatCurrency(value: number): string {
  if (value === 0) return "₹0";
  if (value < 100000) return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (value < 10000000) {
    const lakhs = value / 100000;
    return `₹${Math.round(lakhs * 10) / 10} L`;
  }
  const crores = value / 10000000;
  return `₹${Math.round(crores * 10) / 10} Cr`;
}

function formatSignedPercent(value: number): string {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return `${value}%`;
}

const skeletonCards = [
  { label: "Total clients", value: "Loading", trendText: "Fetching summary", tone: "amber" as const, trend: "neutral" as const },
  { label: "Active SIPs", value: "Loading", trendText: "Fetching summary", tone: "green" as const, trend: "neutral" as const },
  { label: "KYC pending", value: "Loading", trendText: "Fetching summary", tone: "red" as const, trend: "neutral" as const },
  { label: "Avg AUM / client", value: "Loading", trendText: "Fetching summary", tone: "purple" as const, trend: "neutral" as const },
];

export default function ArnClientsKpis({
  summary,
  isLoading,
  error,
  retry,
}: ArnClientsKpisProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {skeletonCards.map((card) => (
          <ArnKpiCard key={card.label} {...card} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-4">
          <ArnErrorState
            title="Could not load clients"
            message={error}
            retry={retry}
          />
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total clients",
      value: String(summary.totalClients),
      trendText: `+${summary.newClientsThisMonth ?? 0} this month`,
      tone: "amber" as const,
      trend: "up" as const,
    },
    {
      label: "Active SIPs",
      value: String(summary.activeSips),
      trendText: `${formatCurrency(summary.activeSipsMonthlyAmount ?? 0)} / month`,
      tone: "green" as const,
      trend: "up" as const,
    },
    {
      label: "KYC pending",
      value: String(summary.kycPending),
      trendText: "Action needed",
      tone: "red" as const,
      trend: "down" as const,
    },
    {
      label: "Avg AUM / client",
      value: summary.avgAumPerClient,
      trendText: `${formatSignedPercent(summary.avgAumYoYChangePercent ?? 0)} YoY`,
      tone: "purple" as const,
      trend: "up" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <ArnKpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
