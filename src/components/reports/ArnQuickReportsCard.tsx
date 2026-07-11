"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnReportCard from "./ArnReportCard";
import type { ArnReportType } from "@/types/arnReports";

export interface QuickReportItem {
  id: ArnReportType;
  title: string;
  description: string;
}

interface ArnQuickReportsCardProps {
  reports: QuickReportItem[];
  selectedReport: ArnReportType;
  onSelect: (reportType: ArnReportType) => void;
}

export default function ArnQuickReportsCard({
  reports,
  selectedReport,
  onSelect,
}: ArnQuickReportsCardProps) {
  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 sm:p-6">
      <ArnCardHeader title="Quick reports" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {reports.map((report) => (
          <ArnReportCard
            key={report.id}
            reportType={report.id}
            title={report.title}
            description={report.description}
            isActive={selectedReport === report.id}
            onClick={() => onSelect(report.id)}
          />
        ))}
      </div>
    </div>
  );
}
