"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnErrorState from "@/components/common/ArnErrorState";
import type { ArnOrderTypeSplit } from "@/types/arnOrders";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const chartColors = ["#BA7517", "#185FA5", "#3B6D11", "#534AB7"];

function getToneColor(tone: ArnOrderTypeSplit["tone"]): string {
  if (tone === "green") return "#3B6D11";
  if (tone === "blue") return "#185FA5";
  if (tone === "purple") return "#534AB7";
  return "#BA7517";
}

interface ArnOrderTypeSplitChartProps {
  splits: ArnOrderTypeSplit[];
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
  totalOrders?: number;
}

export default function ArnOrderTypeSplitChart({ splits, isLoading, error, retry, totalOrders }: ArnOrderTypeSplitChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: "100%",
      width: "100%",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: splits.length ? splits.map((item) => getToneColor(item.tone)) : chartColors,
    labels: splits.length ? splits.map((item) => item.label) : ["SIP", "Lumpsum", "Redemption", "Switch"],
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              color: "#a8a8a3",
              fontSize: "11px",
            },
            value: {
              color: "#1a1a18",
              fontSize: "18px",
              fontWeight: 700,
              formatter: (value) => `${Number(value).toFixed(0)}%`,
            },
            total: {
              show: true,
              label: "Jun",
              color: "#a8a8a3",
              fontSize: "11px",
              formatter: () => String(totalOrders ?? 0),
            },
          },
        },
      },
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      },
      y: {
        formatter: (value) => `${Number(value).toFixed(0)}%`,
      },
    },
  };

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Order type split (Jun)" />
      {isLoading ? (
        <div className="relative h-[140px] animate-pulse rounded-[14px] bg-[var(--arn-bg-2)]" />
      ) : error ? (
        <ArnErrorState
          title="Could not load order split"
          message={error}
          retry={retry}
        />
      ) : (
        <>
          <div className="relative h-[140px] sm:h-[160px]">
            <ReactApexChart
              options={options}
              series={splits.length ? splits.map((item) => item.percentage) : [58, 26, 10, 6]}
              type="donut"
              height="100%"
              width="100%"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-[var(--arn-txt-2)] sm:text-xs">
            {(splits.length ? splits : []).map((item) => (
              <span key={item.type} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-[2px]" style={{ background: getToneColor(item.tone) }} />
                {item.label} {item.percentage}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
