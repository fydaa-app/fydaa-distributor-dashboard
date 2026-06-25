"use client";

import ArnDashboardKpis from "@/components/ecommerce/ArnDashboardKpis";
import ArnAumTrendChart from "@/components/ecommerce/ArnAumTrendChart";
import ArnSipBookList from "@/components/ecommerce/ArnSipBookList";
import ArnTopClientsCard from "@/components/ecommerce/ArnTopClientsCard";
import ArnTaskWidget from "@/components/ecommerce/ArnTaskWidget";

export default function ArnDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ArnDashboardKpis />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnAumTrendChart />
        <ArnSipBookList />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        <ArnTopClientsCard />
        <ArnTaskWidget />
      </div>
    </div>
  );
}
