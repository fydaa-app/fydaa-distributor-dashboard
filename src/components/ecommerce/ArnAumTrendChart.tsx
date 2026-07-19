"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import type { ApexOptions } from "apexcharts";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import type { ArnDashboardAumTrend } from "@/types/arnDashboard";

interface ArnAumTrendChartProps {
  aumTrend: ArnDashboardAumTrend[];
}

function toCr(value: number): number {
  return Number((value / 10000000).toFixed(2));
}

export default function ArnAumTrendChart({ aumTrend }: ArnAumTrendChartProps) {
  const xCategories = aumTrend.map((point) => point.month);
  const seriesData = aumTrend.map((point) => toCr(point.aum));

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: "100%",
      width: "100%",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    colors: ["#BA7517"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.28,
        opacityTo: 0.04,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      strokeColors: "#BA7517",
      hover: {
        size: 7,
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.08)",
      strokeDashArray: 4,
      padding: {
        left: 0,
        right: 0,
        top: 0,
      },
    },
    xaxis: {
      categories: xCategories,
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
        formatter: (value) => `₹${value}Cr`,
      },
    },
    tooltip: {
      theme: "dark",
      style: {
        fontSize: "12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      },
      x: {
        show: true,
        formatter: (value) => xCategories[Number(value)] || String(value),
      },
      y: {
        title: {
          formatter: () => "AUM:",
        },
        formatter: (value) => `₹${value} Cr`,
      },
    },
  };

  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1a] sm:p-6">
      <ArnCardHeader title="AUM trend">
        {/* <ArnChartPeriodTabs
          options={["6M", "1Y", "All"]}
          active={activeRange}
          onChange={setActiveRange}
        /> */}
      </ArnCardHeader>
      <div className="relative h-[220px] sm:h-[260px] lg:h-[300px]">
        <ReactApexChart
          options={options}
          series={[
            {
              name: "AUM",
              data: seriesData,
            },
          ]}
          type="area"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}
