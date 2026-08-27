"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnErrorState from "@/components/common/ArnErrorState";
import type { ArnOrderTypeSplit } from "@/types/arnOrders";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const chartColors = ["var(--arn-processing-txt)", "var(--arn-lumpsum-txt)", "var(--arn-redemption-txt)"];

function getTypeColor(type: ArnOrderTypeSplit["type"]): string {
  if (type === "sip") return "var(--arn-processing-txt)";
  if (type === "lumpsum") return "var(--arn-lumpsum-txt)";
  if (type === "redemption") return "var(--arn-redemption-txt)";
  return "var(--arn-processing-txt)";
}

interface ArnOrderTypeSplitChartProps {
  splits: ArnOrderTypeSplit[];
  isLoading?: boolean;
  error?: string | null;
  retry?: () => void;
  totalOrders?: number;
  monthLabel?: string;
}

export default function ArnOrderTypeSplitChart({ splits, isLoading, error, retry, totalOrders, monthLabel = "Jun" }: ArnOrderTypeSplitChartProps) {
  const visibleSplits = splits.filter((item) => item.type !== "switch");

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      type: "donut",
      height: "100%",
      width: "100%",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: visibleSplits.length ? visibleSplits.map((item) => getTypeColor(item.type)) : chartColors,
    labels: visibleSplits.length ? visibleSplits.map((item) => item.label) : ["SIP", "Lumpsum", "Redemption"],
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
              color: "var(--arn-txt)",
              fontSize: "18px",
              fontWeight: 700,
              formatter: (value) => `${Number(value).toFixed(0)}%`,
            },
            total: {
              show: true,
              label: monthLabel,
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
  }), [visibleSplits, totalOrders, monthLabel]);

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title={`Order type split (${monthLabel})`} />
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
              series={visibleSplits.length ? visibleSplits.map((item) => item.percentage) : [58, 26, 10]}
              type="donut"
              height="100%"
              width="100%"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-[var(--arn-txt-2)] sm:text-xs">
            {visibleSplits.map((item) => (
              <span key={item.type} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-[2px]" style={{ background: getTypeColor(item.type) }} />
                {item.label} {item.percentage}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
