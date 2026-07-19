"use client";

import { useCallback, useEffect, useState } from "react";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnQuickReportsCard, { QuickReportItem } from "@/components/reports/ArnQuickReportsCard";
import ArnReportPreviewCard from "@/components/reports/ArnReportPreviewCard";
import ArnPortfolioSummaryTable from "@/components/tables/ArnPortfolioSummaryTable";
import { getArnReports, getArnQuickReports } from "@/services/arnReportsService";
import type {
  ArnPortfolioSummaryRow,
  ArnReportDateOption,
  ArnReportPreview,
  ArnReportType,
} from "@/types/arnReports";

const fallbackQuickReports: QuickReportItem[] = [
  { id: "valuation", title: "Valuation report", description: "Current value + P&L" },
  { id: "capital_gains", title: "Capital gains", description: "STCG / LTCG for tax" },
  { id: "sip_performance", title: "SIP performance", description: "XIRR per SIP" },
  { id: "transaction_history", title: "Transaction history", description: "Full ledger by date" },
  { id: "xirr_summary", title: "XIRR summary", description: "Returns all clients" },
  { id: "aum_statement", title: "AUM statement", description: "Scheme-wise snapshot" },
];

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ArnReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ArnReportType>("valuation");
  const [dateOption, setDateOption] = useState<ArnReportDateOption>("as-on-date");
  const [customDate, setCustomDate] = useState<string>(todayIso());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [preview, setPreview] = useState<ArnReportPreview | null>(null);
  const [clients, setClients] = useState<ArnPortfolioSummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickReports, setQuickReports] = useState<QuickReportItem[]>(fallbackQuickReports);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getArnReports({
        reportType: selectedReport,
        asOfDate: dateOption === "custom" ? customDate : todayIso(),
        search: debouncedSearch || undefined,
        page,
        limit: 5,
      });

      setPreview(result.preview);
      setClients(result.clients);
      setTotal(result.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [selectedReport, dateOption, customDate, debouncedSearch, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedReport, dateOption, customDate]);

  useEffect(() => {
    let active = true;
    getArnQuickReports()
      .then((result) => {
        if (active && result.length) setQuickReports(result as QuickReportItem[]);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnQuickReportsCard
          reports={quickReports}
          selectedReport={selectedReport}
          onSelect={setSelectedReport}
        />

        {error ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
            <ArnErrorState
              title="Could not load report preview"
              message={error}
              retry={loadReports}
            />
          </div>
        ) : (
          <ArnReportPreviewCard
            reportType={selectedReport}
            dateOption={dateOption}
            customDate={customDate}
            onDateOptionChange={setDateOption}
            onCustomDateChange={setCustomDate}
            preview={preview}
            isLoading={loading}
          />
        )}
      </div>

      <ArnPortfolioSummaryTable
        clients={clients}
        total={total}
        page={page}
        pageSize={5}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        isLoading={loading}
      />
    </div>
  );
}
