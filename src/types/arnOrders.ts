import type { ArnTone } from "@/types/arnClient";

export type ArnOrderType = "sip" | "lumpsum" | "redemption" | "switch";
export type ArnOrderStatus = "done" | "pending" | "failed" | "processing";
export type ArnOrderFilter = ArnOrderType | "all" | "failed";
export type ArnOrderSortKey = "date" | "clientName" | "fundName" | "type" | "amount" | "orderAmount" | "processedAmount" | "units" | "status";

export interface ArnOrdersKpis {
  ordersToday: number;
  successfulToday: number;
  processedJune: number;
  transactedAmountThisMonth: number;
  failedOrders: number;
  pendingOrders: number;
}

export interface ArnOrderActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  timestampLabel: string;
  status: ArnOrderStatus;
  statusLabel: string;
}

export interface ArnOrderTypeSplit {
  type: ArnOrderType;
  label: string;
  percentage: number;
  valueInPaise: number;
  tone: ArnTone;
}

export interface ArnOrderItem {
  id: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  clientName: string;
  clientShortName: string;
  clientId: string;
  initials: string;
  tone: ArnTone;
  fundName: string;
  type: ArnOrderType;
  typeLabel: string;
  amount: string;
  amountInPaise: number;
  orderAmount: string;
  orderAmountInPaise: number;
  processedAmount: string;
  processedAmountInPaise: number;
  units: string;
  unitsValue?: number;
  status: ArnOrderStatus;
  statusLabel: string;
  actionLabel: string;
}

export interface ArnOrdersListParams {
  search?: string;
  filter?: ArnOrderFilter;
  status?: ArnOrderStatus | "all";
  page: number;
  pageSize: number;
  sortKey?: ArnOrderSortKey;
  sortDirection?: "asc" | "desc";
}

export interface ArnOrdersResponse extends ArnOrdersKpis {
  activities: ArnOrderActivity[];
  typeSplit: ArnOrderTypeSplit[];
  orders: ArnOrderItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ArnOrdersSummary {
  ordersToday: number;
  successfulToday: number;
  processedThisMonth: number;
  transactedAmountThisMonth: number;
  failedOrders: number;
  pendingOrders: number;
  totalOrders: number;
  totalAmount: number;
}

export interface ArnOrdersBackendOrderTypeSplit {
  sipPercent: number;
  lumpsumPercent: number;
  redemptionPercent: number;
  switchPercent: number;
}

export interface ArnOrdersBackendPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasMore: boolean;
}

export interface ArnOrdersBackendResponse {
  success: boolean;
  distributor: unknown;
  period: unknown;
  summary: ArnOrdersSummary;
  todayActivity: unknown[];
  orderTypeSplit: ArnOrdersBackendOrderTypeSplit;
  filterCounts: {
    all: number;
    sip: number;
    lumpsum: number;
    redemption: number;
    failed: number;
  };
  statusCounts: {
    all: number;
    successful: number;
    failed: number;
    in_progress: number;
  };
  orders: unknown[];
  pagination: ArnOrdersBackendPagination;
}

export interface ArnOrdersFetchParams {
  search?: string;
  filter?: ArnOrderFilter;
  status?: ArnOrderStatus | "all";
  page: number;
  pageSize: number;
  type?: "individual" | "team";
  sortKey?: ArnOrderSortKey;
  sortDirection?: "asc" | "desc";
}

export interface ArnOrdersFetchResult {
  kpis: ArnOrdersKpis;
  activities: ArnOrderActivity[];
  typeSplit: ArnOrderTypeSplit[];
  orders: ArnOrderItem[];
  total: number;
  page: number;
  pageSize: number;
  pagination: ArnOrdersBackendPagination;
}
