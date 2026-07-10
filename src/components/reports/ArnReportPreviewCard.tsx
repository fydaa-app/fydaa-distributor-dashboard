"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import type {
  ArnReportDateOption,
  ArnReportPreview,
  ArnReportType,
} from "@/types/arnReports";

const reportTitles: Record<ArnReportType, string> = {
  valuation: "Valuation report",
  "capital-gains": "Capital gains",
  "sip-performance": "SIP performance",
  "transaction-history": "Transaction history",
  "xirr-summary": "XIRR summary",
  "aum-statement": "AUM statement",
};

const dateOptions: { value: ArnReportDateOption; label: string }[] = [
  { value: "as-on-date", label: "As on date (today)" },
  { value: "custom", label: "Custom date" },
];

interface ArnReportPreviewCardProps {
  reportType: ArnReportType;
  dateOption: ArnReportDateOption;
  customDate: string;
  onDateOptionChange: (option: ArnReportDateOption) => void;
  onCustomDateChange: (date: string) => void;
  preview: ArnReportPreview | null;
  isLoading?: boolean;
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
  dateOption,
  customDate,
  onDateOptionChange,
  onCustomDateChange,
  preview,
  isLoading = false,
}: ArnReportPreviewCardProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title={reportTitles[reportType]} />

      <div className="mb-4 space-y-3">
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

        {dateOption === "custom" && (
          <input
            type="date"
            value={customDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(event) => onCustomDateChange(event.target.value)}
            className="w-full rounded-md border border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] px-2.5 py-2 text-xs text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
          />
        )}
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
              Preview — all {preview.clientCount} clients
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
