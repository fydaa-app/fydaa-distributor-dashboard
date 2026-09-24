"use client";

import ArnErrorState from "@/components/common/ArnErrorState";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import type { PartnerLeadStats } from "@/types/arnLead";

interface ArnPartnerLeadStatsKpisProps {
  stats: PartnerLeadStats | null;
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
}

const skeletonLabels = ["Total Leads", "New", "In Progress", "Converted", "Lost", "Conversion Rate"];

export default function ArnPartnerLeadStatsKpis({
  stats,
  isLoading,
  error,
  retry,
}: ArnPartnerLeadStatsKpisProps) {
  if (error) {
    return (
      <ArnErrorState title="Could not load lead stats" message={error} retry={retry} />
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {skeletonLabels.map((label) => (
          <ArnKpiCard key={label} label={label} value="Loading" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Leads", value: String(stats.total) },
    { label: "New", value: String(stats.new) },
    { label: "In Progress", value: String(stats["in-progress"]) },
    { label: "Converted", value: String(stats.converted) },
    { label: "Lost", value: String(stats.lost) },
    { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <ArnKpiCard key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
