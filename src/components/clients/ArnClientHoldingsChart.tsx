"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import ArnClientAvatar from "@/components/common/ArnClientAvatar";
import type { ArnHolding, ArnTone } from "@/types/arnClient";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ArnClientHoldingsChartProps {
  holdings: ArnHolding[];
}

const toneColors: Record<ArnTone, string> = {
  amber: "#BA7517",
  green: "#3B6D11",
  blue: "#185FA5",
  red: "#A32D2D",
  purple: "#534AB7",
  teal: "#0F6E56",
};

export default function ArnClientHoldingsChart({ holdings }: ArnClientHoldingsChartProps) {
  const total = holdings.reduce((sum, holding) => sum + holding.valueInPaise, 0);
  const series = holdings.map((holding) => (total > 0 ? Math.round((holding.valueInPaise / total) * 100) : 0));
  const labels = holdings.map((holding) => holding.assetClass);
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 110,
      toolbar: { show: false },
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: holdings.map((holding) => toneColors[holding.tone]),
    labels,
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: "14px",
              fontWeight: 700,
              color: "#1a1a18",
              formatter: (value) => `${value}%`,
            },
            total: {
              show: true,
              label: "Holdings",
              fontSize: "10px",
              color: "#a8a8a3",
              formatter: () => "100%",
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      show: false,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value, context) => {
          const holding = holdings[context.seriesIndex];
          return holding ? `${holding.fundName}: ${value}%` : String(value);
        },
      },
    },
  };

  return (
    <div className="relative h-[110px]">
      <ReactApexChart options={options} series={series} type="donut" height={110} width="100%" />
    </div>
  );
}

export function ArnHoldingsLegend({ holdings }: { holdings: ArnHolding[] }) {
  const total = holdings.reduce((sum, holding) => sum + holding.valueInPaise, 0);

  return (
    <div className="mb-4 flex flex-wrap justify-center gap-[14px] text-sm text-[var(--arn-txt-2)]">
      {holdings.map((holding) => {
        const percentage = total > 0 ? Math.round((holding.valueInPaise / total) * 100) : 0;

        return (
          <span key={holding.fundName} className="inline-flex items-center gap-1">
            <ArnClientAvatar initials={holding.assetClass.slice(0, 1)} tone={holding.tone} size="xs" />
            {holding.assetClass} {percentage}%
          </span>
        );
      })}
    </div>
  );
}
