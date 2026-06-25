"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnTabs from "@/components/common/ArnTabs";
import ArnClientDetailHeader from "@/components/clients/ArnClientDetailHeader";
import ArnClientDetailKpis from "@/components/clients/ArnClientDetailKpis";
import ArnClientGoalsList from "@/components/clients/ArnClientGoalsList";
import ArnClientHoldingsChart, { ArnHoldingsLegend } from "@/components/clients/ArnClientHoldingsChart";
import ArnClientHoldingsList from "@/components/clients/ArnClientHoldingsList";
import ArnClientTransactionsTable from "@/components/tables/ArnClientTransactionsTable";
import { getArnClientDetail } from "@/services/arnClientsService";
import type { ArnClientDetail } from "@/types/arnClient";

const tabs = [
  { id: "holdings", label: "Holdings" },
  { id: "transactions", label: "Transactions" },
  { id: "goals", label: "Goals" },
];

export default function ArnClientDetailPage() {
  const params = useParams();
  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const [detail, setDetail] = useState<ArnClientDetail | null>(null);
  const [activeTab, setActiveTab] = useState("holdings");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getArnClientDetail(clientId);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load client detail.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
        <div className="animate-pulse rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
          <div className="mb-4 h-4 w-40 rounded bg-[var(--arn-bg-2)]" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--arn-bg-2)]" />
            <div className="h-4 flex-1 rounded bg-[var(--arn-bg-2)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
        <LinkBackToClients />
        <ArnErrorState
          title="Client not found"
          message={error || "The client you are looking for does not exist."}
          retry={loadDetail}
          action={<LinkBackToClients />}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <LinkBackToClients />

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnClientDetailHeader
          client={detail.client}
          clientSince={detail.clientSince}
          sipActive={detail.sipActive}
          kycComplete={detail.kycComplete}
          clientId={clientId}
        />
        <ArnClientDetailKpis detail={detail} />
      </div>

      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
        <ArnCardHeader title={`${detail.client.name} portfolio`} />
        <ArnTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "holdings" && (
          <div>
            <ArnClientHoldingsChart holdings={detail.holdings} />
            <ArnHoldingsLegend holdings={detail.holdings} />
            <ArnClientHoldingsList holdings={detail.holdings} />
          </div>
        )}

        {activeTab === "transactions" && (
          <ArnClientTransactionsTable transactions={detail.transactions} />
        )}

        {activeTab === "goals" && (
          <ArnClientGoalsList goals={detail.goals} />
        )}
      </div>
    </div>
  );
}

function LinkBackToClients() {
  return (
    <Link
      href="/arn-clients"
      className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--arn-amber)]"
    >
      <i aria-hidden="true" className="ti ti-arrow-left" />
      Back to clients
    </Link>
  );
}
