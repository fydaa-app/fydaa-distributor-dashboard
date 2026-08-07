import type { ArnTone } from "@/types/arnClient";

export type ArnSipBookStatus = "active" | "inactive" | "cancelled";

export type ArnSipBookFilter = "all" | "active" | "inactive" | "cancelled" | "sips_at_risk";

export type ArnSipBookSortKey = "clientName" | "fundName" | "amount" | "sipDay" | "nextSipDate" | "xirr";

export interface ArnSipBookKpis {
  totalSipBook: string;
  totalSipBookInPaise: number;
  activeSips: number;
  atRiskSips: number;
  cancelledSips: number;
  activeSipClients?: number;
  newSipsThisMonth?: number;
}

export interface ArnSipBookTrendPoint {
  month: string;
  monthLabel: string;
  value: string;
  valueInPaise: number;
}

export interface ArnSipBookHealthMetric {
  label: string;
  value: string;
  caption: string;
  progress?: number;
  tone: ArnTone;
}

export interface ArnSipBookItem {
  id: string;
  clientId: string;
  clientName: string;
  initials: string;
  tone: ArnTone;
  fundName: string;
  amount: string;
  amountInPaise: number;
  goalAmount: string;
  goalAmountInPaise: number;
  rawStatus: string;
  planId: string;
  sipDay: string;
  sipDayLabel: string;
  nextSipDate: string;
  nextSipLabel: string;
  xirr: number;
  status: ArnSipBookStatus;
  statusLabel: string;
  bookStatus: string;
}

export interface ArnSipBookListParams {
  search?: string;
  status?: ArnSipBookFilter;
  page: number;
  pageSize: number;
  sortKey?: ArnSipBookSortKey;
  sortDirection?: "asc" | "desc";
}

export interface ArnSipBookTrendParams {
  range?: "6M" | "1Y";
}

export interface ArnSipBookSummary {
  totalSipBookMonthly: number;
  newSipsThisMonth: number;
  activeSips: number;
  activeSipClients: number;
  atRiskSips: number;
  sipsAtRisk?: number;
  cancelledSips: number;
}

export interface ArnSipBookInflowTrendPoint {
  month: string;
  monthLabel: string;
  amount: number;
}

export interface ArnSipBookHealthData {
  successRate: number;
  successRatePeriod: string;
  nachCoveragePercent: number;
  nachCoveredSips: number;
  nachTotalSips: number;
  stepUpSips: number;
  stepUpAvgIncreasePercent: number;
  avgSipAgeMonths: number;
  longestSipAgeMonths: number;
}

export interface ArnSipBookBackendSip {
  sipId: number;
  userId: number;
  clientName: string;
  fund: string;
  amount: number;
  goalAmount: number;
  rawStatus: string;
  planId: number | null;
  deductionDay: string | number;
  nextSipDate: string | Date | null;
  xirr: number;
  status: string;
  bookStatus: "active" | "at_risk" | "paused" | "cancelled" | "inactive";
}

export interface ArnSipBookBackendResponse {
  success: boolean;
  summary: ArnSipBookSummary;
  inflowTrend: ArnSipBookInflowTrendPoint[];
  health: ArnSipBookHealthData;
  filterCounts: Record<string, number>;
  sips: ArnSipBookBackendSip[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
  };
  distributor: {
    arn: string | null;
    name: string | null;
  } | null;
}

export interface ArnSipBookApiResult {
  sips: ArnSipBookItem[];
  total: number;
  summary: ArnSipBookSummary | null;
  inflowTrend: ArnSipBookTrendPoint[];
  health: ArnSipBookHealthData | null;
}
