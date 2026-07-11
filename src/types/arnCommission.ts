import type { ArnTone } from "@/types/arnClient";

export type ArnCommissionStatus = "paid" | "processing" | "pending" | "failed";
export type ArnCommissionSortKey = "month" | "aum" | "trail" | "upfront" | "total" | "status";

export interface ArnCommissionKpis {
  trailMay: string;
  trailMayInPaise: number;
  fy26Total: string;
  fy26TotalInPaise: number;
  effectiveTrailRate: string;
  trendText: string;
}

export interface ArnCommissionTrendPoint {
  month: string;
  value: string;
  valueInPaise: number;
}

export interface ArnAmcSplit {
  amc: string;
  label: string;
  percentage: number;
  valueInPaise: number;
  tone: ArnTone;
}

export interface ArnCommissionLedgerItem {
  id: string;
  month: string;
  monthKey: string;
  aum: string;
  aumInPaise: number;
  trail: string;
  trailInPaise: number;
  upfront: string;
  upfrontInPaise: number;
  total: string;
  totalInPaise: number;
  status: ArnCommissionStatus;
  statusLabel: string;
  actionLabel: string;
}

export interface ArnCommissionListParams {
  search?: string;
  status?: ArnCommissionStatus | "all";
  month?: string;
  page: number;
  pageSize: number;
  sortKey?: ArnCommissionSortKey;
  sortDirection?: "asc" | "desc";
}

export interface ArnCommissionResponse extends ArnCommissionKpis {
  trend: ArnCommissionTrendPoint[];
  amcSplit: ArnAmcSplit[];
  ledger: ArnCommissionLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
}
