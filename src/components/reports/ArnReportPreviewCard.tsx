"use client";

import { useRouter } from "next/navigation";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnFilterPill from "@/components/common/ArnFilterPill";
import type { ArnReportDateOption, ArnReportPreview, ArnReportScope, ArnReportType } from "@/types/arnReports";

const reportTitles: Record<ArnReportType, string> = {
  valuation: "Valuation report",
  "capital-gains": "Capital gains",
  "sip-performance": "SIP performance",
  "transaction-history": "Transaction history",
  "xirr-summary": "XIRR summary",
  "aum-statement": "AUM statement",
};

const dateOptions: { value: ArnReportDateOption; label: string }[] = [
  { value: "today", label: "As on today (11 Jun 2026)" },
  { value: "fy-end", label: "31 Mar 2026 (FY end)" },
  { value: "custom", label: "Custom date range" },
];

interface ArnReportPreviewCardProps {
  reportType: ArnReportType;
  scope: ArnReportScope;
  dateOption: ArnReportDateOption;
  preview: ArnReportPreview | null;
  isLoading?: boolean;
  onScopeChange: (scope: ArnReportScope) => void;
  onDateOptionChange: (option: ArnReportDateOption) => void;
  onExportPdf?: () => void;
}

function PreviewRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--arn-bdr)] py-2 text-xs last:border-b-0">
      <span className="text-[var(--arn-txt-2)]">{label}</span>
      <span className={valueClass || "font-bold text-[var(--arn-txt)]"}>{value}</span>
    </div>
  );
}

export default function ArnReportPreviewCard({
  reportType,
  scope,
  dateOption,
  preview,
  isLoading = false,
  onScopeChange,
  onDateOptionChange,
  onExportPdf,
}: ArnReportPreviewCardProps) {
  const router = useRouter();

  const handleSend = () => {
    router.push(`/arn-share?report=${reportType}`);
  };

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title={reportTitles[reportType]}>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--arn-bdr)] px-3 py-1.5 text-xs font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
          >
            <i aria-hidden="true" className="ti ti-download" />
            PDF
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--arn-amber)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <i aria-hidden="true" className="ti ti-send" />
            Send
          </button>
        </div>
      </ArnCardHeader>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <ArnFilterPill
            label="All clients"
            active={scope === "all-clients"}
            onClick={() => onScopeChange("all-clients")}
          />
          <ArnFilterPill
            label="Select clients"
            active={scope === "select-clients"}
            onClick={() => onScopeChange("select-clients")}
          />
        </div>

        <select
          value={dateOption}
          onChange={(event) => onDateOptionChange(event.target.value as ArnReportDateOption)}
          className="w-full rounded-md border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] px-2.5 py-2 text-xs text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
        >
          {dateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-[var(--arn-bg-2)] p-4">
        {isLoading || !preview ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-4 animate-pulse rounded bg-[var(--arn-bg-3)]" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm font-bold text-[var(--arn-txt)]">
              Preview — {scope === "all-clients" ? `all ${preview.clientCount} clients` : "selected clients"}
            </div>
            <PreviewRow label="Total invested" value={preview.totalInvested} />
            <PreviewRow label="Current value" value={preview.currentValue} />
            <PreviewRow
              label={reportType === "capital-gains" ? "STCG" : "Unrealised P&L"}
              value={preview.unrealisedPnl}
              valueClass="font-bold text-[var(--arn-green)]"
            />
            <PreviewRow
              label={reportType === "capital-gains" ? "LTCG" : reportType === "transaction-history" ? "Period" : "Overall XIRR"}
              value={reportType === "capital-gains" ? preview.unrealisedPnlPercent : preview.overallXirr}
              valueClass="font-bold text-[var(--arn-green)]"
            />
            <PreviewRow label="Pages" value={preview.estimatedPages} />
          </>
        )}
      </div>
    </div>
  );
}
