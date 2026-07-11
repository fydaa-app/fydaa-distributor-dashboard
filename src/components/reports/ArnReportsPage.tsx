"use client";

import { useCallback, useEffect, useState } from "react";
import ArnErrorState from "@/components/common/ArnErrorState";
import ArnQuickReportsCard from "@/components/reports/ArnQuickReportsCard";
import ArnReportPreviewCard from "@/components/reports/ArnReportPreviewCard";
import ArnPortfolioSummaryTable from "@/components/tables/ArnPortfolioSummaryTable";
import {
  exportArnPortfolioSummaryCsv,
  getArnPortfolioSummary,
  getArnReportPreview,
} from "@/services/arnReportsService";
import type { ArnPortfolioSummaryRow } from "@/types/arnReports";
import type {
  ArnReportDateOption,
  ArnReportPreview,
  ArnReportScope,
  ArnReportType,
} from "@/types/arnReports";

const quickReports = [
  { id: "valuation" as const, title: "Valuation report", description: "Current value + P&L" },
  { id: "capital-gains" as const, title: "Capital gains", description: "STCG / LTCG for tax" },
  { id: "sip-performance" as const, title: "SIP performance", description: "XIRR per SIP" },
  { id: "transaction-history" as const, title: "Transaction history", description: "Full ledger by date" },
  { id: "xirr-summary" as const, title: "XIRR summary", description: "Returns all clients" },
  { id: "aum-statement" as const, title: "AUM statement", description: "Scheme-wise snapshot" },
];

const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function ArnReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ArnReportType>("valuation");
  const [scope, setScope] = useState<ArnReportScope>("all-clients");
  const [dateOption, setDateOption] = useState<ArnReportDateOption>("today");
  const [preview, setPreview] = useState<ArnReportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [clients, setClients] = useState<ArnPortfolioSummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      setPreview(
        await getArnReportPreview({
          reportType: selectedReport,
          scope,
          dateOption,
        })
      );
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Could not load report preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, [dateOption, scope, selectedReport]);

  const loadTable = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);

    try {
      const response = await getArnPortfolioSummary({ page, pageSize: 5 });
      setClients(response.items);
      setTotal(response.total);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : "Could not load portfolio summary.");
    } finally {
      setTableLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  useEffect(() => {
    if (!exportMessage) return undefined;
    const timeout = window.setTimeout(() => setExportMessage(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [exportMessage]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await exportArnPortfolioSummaryCsv();
      setExportMessage(response.message);
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : "Could not export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ArnQuickReportsCard
          reports={quickReports}
          selectedReport={selectedReport}
          onSelect={setSelectedReport}
        />

        {previewError ? (
          <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
            <ArnErrorState
              title="Could not load report preview"
              message={previewError}
              retry={loadPreview}
            />
          </div>
        ) : (
          <ArnReportPreviewCard
            reportType={selectedReport}
            scope={scope}
            dateOption={dateOption}
            preview={preview}
            isLoading={previewLoading}
            onScopeChange={setScope}
            onDateOptionChange={setDateOption}
            onExportPdf={handleExportCsv}
          />
        )}
      </div>

      {tableError ? (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
          <ArnErrorState
            title="Could not load portfolio summary"
            message={tableError}
            retry={loadTable}
          />
        </div>
      ) : tableLoading ? (
        <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
          <div className="mb-4 h-5 w-48 animate-pulse rounded bg-[var(--arn-bg-2)]" />
          <div className="overflow-hidden rounded-[16px] border border-[var(--arn-bdr)]">
            {skeletonRows.map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-[var(--arn-bdr)] p-4">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[var(--arn-bg-2)]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-[var(--arn-bg-2)]" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--arn-bg-2)]" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ArnPortfolioSummaryTable
          clients={clients}
          total={total}
          page={page}
          pageSize={5}
          onPageChange={setPage}
          onExport={handleExportCsv}
          isExporting={isExporting}
        />
      )}

      {exportMessage && (
        <div className="rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-4 py-3 text-sm font-semibold text-[var(--arn-txt)]">
          {exportMessage}
        </div>
      )}
    </div>
  );
}
