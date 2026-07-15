import ArnKpiCard from "@/components/common/ArnKpiCard";
import type { ArnClientDetail } from "@/types/arnClient";

interface ArnClientDetailKpisProps {
  detail: ArnClientDetail;
}

export default function ArnClientDetailKpis({ detail }: ArnClientDetailKpisProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <ArnKpiCard
        label="Portfolio value"
        value={detail.portfolioValue}
        trendText={`${detail.gainLoss} gain/loss`}
        tone="amber"
        trend={detail.gainLossPositive ? "up" : "down"}
      />
      <ArnKpiCard
        label="XIRR"
        value={`${detail.xirr.toFixed(1)}%`}
        trendText="vs 12.4% benchmark"
        tone="green"
        trend={detail.xirr >= 12.4 ? "up" : "down"}
      />
      <ArnKpiCard
        label="Monthly SIP"
        value={detail.monthlySip}
        trendText={`${detail.goals.length} ${detail.goals.length === 1 ? "Goal" : "Goals"}`}
        tone="blue"
        trend="neutral"
      />
    </div>
  );
}
