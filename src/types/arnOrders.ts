import type { ArnTone } from "@/types/arnClient";

export type ArnOrderType = "sip" | "lumpsum" | "redemption" | "switch";
export type ArnOrderStatus = "done" | "pending" | "failed" | "processing";
export type ArnOrderFilter = ArnOrderType | "all" | "failed";
export type ArnOrderSortKey = "date" | "clientName" | "fundName" | "type" | "amount" | "units" | "status";

export interface ArnOrdersKpis {
  ordersToday: number;
  successfulToday: number;
  processedJune: number;
  transactedJuneInPaise: number;
  failedOrders: number;
  pendingOrders: number;
}

export interface ArnOrderActivity {
  id: string;
  title: string;
  description: string;
  amountInPaise: number;
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
