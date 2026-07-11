"use client";

import { useEffect, useState } from "react";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnKpiCard from "@/components/common/ArnKpiCard";
import { getArnClientsKpis } from "@/services/arnClientsService";
import type { ArnClientsKpis as ArnClientsKpisData } from "@/types/arnClient";

const skeletonCards = [
  { label: "Total clients", value: "Loading", trendText: "Fetching summary", tone: "amber" as const, trend: "neutral" as const },
  { label: "Active SIPs", value: "Loading", trendText: "Fetching summary", tone: "green" as const, trend: "neutral" as const },
  { label: "KYC pending", value: "Loading", trendText: "Fetching summary", tone: "red" as const, trend: "neutral" as const },
  { label: "Avg AUM / client", value: "Loading", trendText: "Fetching summary", tone: "purple" as const, trend: "neutral" as const },
];

export default function ArnClientsKpis() {
  const [kpis, setKpis] = useState<ArnClientsKpisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await getArnClientsKpis();
      setKpis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load client summary.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-4">
          <ArnErrorState
            title="Could not load client summary"
            message={error}
            retry={load}
          />
        </div>
      </div>
    );
  }

  const cards = kpis
    ? [
        {
          label: "Total clients",
          value: String(kpis.totalClients),
          trendText: "+3 this month",
          tone: "amber" as const,
          trend: "up" as const,
        },
        {
          label: "Active SIPs",
          value: String(kpis.activeSips),
          trendText: "₹3.8 L / month",
          tone: "green" as const,
          trend: "up" as const,
        },
        {
          label: "KYC pending",
          value: String(kpis.kycPending),
          trendText: "Action needed",
          tone: "red" as const,
          trend: "down" as const,
        },
        {
          label: "Avg AUM / client",
          value: kpis.avgAumPerClient,
          trendText: "+12% YoY",
          tone: "purple" as const,
          trend: "up" as const,
        },
      ]
    : skeletonCards;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <ArnKpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
