import type { ArnTone } from "@/types/arnClient";

export type ArnSipBookStatus = "active" | "paused" | "at-risk" | "due-today";

export type ArnSipBookFilter = ArnSipBookStatus | "all";

export type ArnSipBookSortKey = "clientName" | "fundName" | "amount" | "sipDay" | "nextSipDate" | "xirr";

export interface ArnSipBookKpis {
  totalSipBook: string;
  totalSipBookInPaise: number;
  activeSips: number;
  atRiskSips: number;
  pausedSips: number;
  clientsWithSips: number;
}

export interface ArnSipBookTrendPoint {
  month: string;
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
  sipDay: string;
  sipDayLabel: string;
  nextSipDate: string;
  nextSipLabel: string;
  xirr: number;
  status: ArnSipBookStatus;
  statusLabel: string;
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
