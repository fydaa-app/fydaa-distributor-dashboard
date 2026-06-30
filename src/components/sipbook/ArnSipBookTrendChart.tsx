"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnChartPeriodTabs from "@/components/common/ArnChartPeriodTabs";
import type { ArnSipBookTrendPoint } from "@/types/arnSipBook";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TrendRange = "6M" | "1Y";

const chartCategories: Record<TrendRange, string[]> = {
  "6M": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "1Y": ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
};

interface ArnSipBookTrendChartProps {
  inflowTrend: ArnSipBookTrendPoint[];
  trendPeriod: "6M" | "1Y";
  onPeriodChange: (period: "6M" | "1Y") => void;
}

export default function ArnSipBookTrendChart({
  inflowTrend,
  trendPeriod,
  onPeriodChange,
}: ArnSipBookTrendChartProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [inflowTrend]);

  const categories =
    inflowTrend.length > 0
      ? inflowTrend.map((point) => point.month)
      : chartCategories[trendPeriod];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: "100%",
      width: "100%",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: ["#BA7517"],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "54%",
        distributed: true,
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.08)",
      strokeDashArray: 4,
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#a8a8a3",
          fontSize: "11px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#a8a8a3",
          fontSize: "11px",
        },
        formatter: (value) => `₹${value}L`,
      },
      min: 0,
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      },
      y: {
        formatter: (value) => `₹${value} L`,
      },
    },
  };

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="SIP inflow trend">
        <ArnChartPeriodTabs
          options={["6M", "1Y"]}
          active={trendPeriod}
          onChange={(value) => onPeriodChange(value as "6M" | "1Y")}
        />
      </ArnCardHeader>

      {isLoading ? (
        <div className="relative h-[140px] animate-pulse rounded-[14px] bg-[var(--arn-bg-2)]" />
      ) : (
        <div className="relative h-[140px] sm:h-[160px]">
          <ReactApexChart
            options={options}
            series={[
              {
                name: "SIP book",
                data: inflowTrend.map((point) => Number((point.valueInPaise / 100000).toFixed(1))),
              },
            ]}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      )}
    </div>
  );
}
