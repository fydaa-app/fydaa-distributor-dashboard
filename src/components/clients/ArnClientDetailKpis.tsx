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
        trendText="+₹5.2 L YTD"
        tone="amber"
        trend="up"
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
        trendText={`Next: ${detail.nextSipDate}`}
        tone="blue"
        trend="neutral"
      />
    </div>
  );
}
