"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useCallback, useEffect, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnErrorState from "@/components/common/ArnErrorState";
import { getArnCommissionTrend } from "@/services/arnCommissionService";
import type { ArnCommissionTrendPoint } from "@/types/arnCommission";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ArnTrailTrendChart() {
  const [trend, setTrend] = useState<ArnCommissionTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrend = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setTrend(await getArnCommissionTrend());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load trail trend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

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
        distributed: false,
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
      categories: trend.map((point) => point.month),
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
        formatter: (value) => `₹${Math.round(Number(value) / 1000)}K`,
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
        formatter: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
      },
    },
  };

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Monthly trail trend" />
      {isLoading ? (
        <div className="relative h-[140px] animate-pulse rounded-[14px] bg-[var(--arn-bg-2)]" />
      ) : error ? (
        <ArnErrorState
          title="Could not load trail trend"
          message={error}
          retry={loadTrend}
        />
      ) : (
        <div className="relative h-[130px] sm:h-[150px] md:h-[170px]">
          <ReactApexChart
            options={options}
            series={[
              {
                name: "Trail",
                data: trend.map((point) => point.valueInPaise),
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
