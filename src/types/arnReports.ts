import type { ArnTone } from "@/types/arnClient";

export type ArnReportType =
  | "valuation"
  | "capital-gains"
  | "sip-performance"
  | "transaction-history"
  | "xirr-summary"
  | "aum-statement";

export type ArnReportDateOption = "as-on-date" | "custom";

export interface ArnReportPreview {
  reportType: ArnReportType;
  clientCount: number;
  totalInvested: string;
  currentValue: string;
  unrealisedPnl: string;
  unrealisedPnlPercent: string;
  overallXirr: string;
  estimatedPages: string;
}

export interface ArnPortfolioSummaryRow {
  id: string;
  name: string;
  initials: string;
  tone: ArnTone;
  invested: string;
  current: string;
  pnl: string;
  pnlPositive: boolean;
  xirr: string;
  xirrPositive: boolean;
  sipMonthly?: string;
  updated?: string;
}

export interface ArnReportsParams {
  reportType: ArnReportType;
  asOfDate?: string;
  search?: string;
  page: number;
  limit: number;
  type?: "individual" | "team";
}

export interface ArnReportsPagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

export interface ArnReportsResult {
  preview: ArnReportPreview;
  clients: ArnPortfolioSummaryRow[];
  pagination: ArnReportsPagination;
  quickReports?: ArnQuickReportItem[];
}

export interface ArnQuickReportItem {
  id: ArnReportType;
  title: string;
  description: string;
}

export interface ArnReportPreviewParams {
  reportType: ArnReportType;
  dateOption: ArnReportDateOption;
  customDate?: string;
  search?: string;
}
