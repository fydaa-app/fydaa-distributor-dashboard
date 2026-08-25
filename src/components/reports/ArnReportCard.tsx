"use client";

import { cn } from "@/lib/utils";
import type { ArnReportType } from "@/types/arnReports";

const iconToneClasses: Record<ArnReportType, string> = {
  valuation: "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]",
  capital_gains: "bg-[var(--arn-green-bg)] text-[var(--arn-green)]",
  sip_performance: "bg-[var(--arn-blue-bg)] text-[var(--arn-blue)]",
  transaction_history: "bg-[var(--arn-pur-bg)] text-[var(--arn-pur-txt)]",
  xirr_summary: "bg-[var(--arn-amber-bg)] text-[var(--arn-amber-txt)]",
  aum_statement: "bg-[var(--arn-tel-bg)] text-[var(--arn-tel-txt)]",
};

const iconClasses: Record<ArnReportType, string> = {
  valuation: "ti ti-chart-line",
  capital_gains: "ti ti-receipt-tax",
  sip_performance: "ti ti-repeat",
  transaction_history: "ti ti-list",
  xirr_summary: "ti ti-percentage",
  aum_statement: "ti ti-building-bank",
};

interface ArnReportCardProps {
  reportType: ArnReportType;
  title: string;
  description: string;
  isActive?: boolean;
  onClick: () => void;
}

export default function ArnReportCard({
  reportType,
  title,
  description,
  isActive,
  onClick,
}: ArnReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all duration-100",
        isActive
          ? "border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)]"
          : "border-[var(--arn-bdr-2)] bg-[var(--arn-bg-2)] hover:border-[var(--arn-bdr)] hover:bg-[var(--arn-bg)]"
      )}
    >
      <div
        className={cn(
          "mb-2 flex size-8 items-center justify-center rounded-lg",
          iconToneClasses[reportType]
        )}
      >
        <i aria-hidden="true" className={iconClasses[reportType]} />
      </div>
      <div className={cn("text-xs font-bold", isActive ? "text-[var(--arn-txt)]" : "text-[var(--arn-txt-2)]")}>
        {title}
      </div>
      <div className="mt-0.5 text-[10px] text-[var(--arn-txt-3)]">{description}</div>
    </button>
  );
}
