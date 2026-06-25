import type { ArnPaginatedResponse, ArnTone } from "@/types/arnClient";

export type ArnReportType =
  | "valuation"
  | "capital-gains"
  | "sip-performance"
  | "transaction-history"
  | "xirr-summary"
  | "aum-statement";

export type ArnReportScope = "all-clients" | "select-clients";

export type ArnReportDateOption = "today" | "fy-end" | "custom";

export interface ArnReportPreview {
  reportType: ArnReportType;
  scope: ArnReportScope;
  dateOption: ArnReportDateOption;
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
  sipMonthly: string;
  updated: string;
}

export interface ArnPortfolioSummaryParams {
  page: number;
  pageSize: number;
}

export type ArnPortfolioSummaryResponse = ArnPaginatedResponse<ArnPortfolioSummaryRow>;

export interface ArnReportPreviewParams {
  reportType: ArnReportType;
  scope: ArnReportScope;
  dateOption: ArnReportDateOption;
}
