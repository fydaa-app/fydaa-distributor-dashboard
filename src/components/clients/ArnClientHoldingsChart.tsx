"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { ArnAssetAllocationKey, ArnAssetAllocationSlice } from "@/types/arnClient";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ArnClientHoldingsChartProps {
  assetAllocation: ArnAssetAllocationSlice[];
}

const allocationColors: Record<ArnAssetAllocationKey, string> = {
  equity: "#3B6D11",
  debt: "#185FA5",
  gold: "#BA7517",
};

export default function ArnClientHoldingsChart({ assetAllocation }: ArnClientHoldingsChartProps) {
  const slices = assetAllocation.filter((slice) => slice.percentage > 0 || slice.currentValue > 0);
  const series = slices.map((slice) => slice.percentage);
  const labels = slices.map((slice) => slice.label);
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 110,
      toolbar: { show: false },
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: slices.map((slice) => allocationColors[slice.key]),
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
          const slice = slices[context.seriesIndex];
          return slice ? `${slice.label}: ${value}%` : String(value);
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

export function ArnHoldingsLegend({ assetAllocation }: { assetAllocation: ArnAssetAllocationSlice[] }) {
  const slices = assetAllocation.filter((slice) => slice.percentage > 0 || slice.currentValue > 0);

  return (
    <div className="mb-4 flex flex-wrap justify-center gap-[14px] text-sm text-[var(--arn-txt-2)]">
      {slices.map((slice) => (
        <span key={slice.key} className="inline-flex items-center gap-1">
          <span
            className="inline-block h-[9px] w-[9px] rounded-[2px]"
            style={{ backgroundColor: allocationColors[slice.key] }}
          />
          {slice.label} {slice.percentage}%
        </span>
      ))}
    </div>
  );
}
