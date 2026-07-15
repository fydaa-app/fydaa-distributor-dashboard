export type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

export type ArnKycStatus = "done" | "pending" | "not-started" | "expired";

export type ArnSipStatus = "active" | "paused" | "at-risk" | "due-today" | "none";

export interface ArnClient {
  id: string;
  name: string;
  initials: string;
  tone: ArnTone;
  aum: string;
  aumInPaise: number;
  sipMonthly: string;
  sipMonthlyInPaise: number;
  xirr: number;
  kycStatus: ArnKycStatus;
  kycLabel: string;
  sipStatus: ArnSipStatus;
  lastTransactionAt: string;
  lastTransactionLabel: string;
}

export interface ArnClientsKpis {
  totalClients: number;
  activeSips: number;
  kycPending: number;
  avgAumPerClient: string;
  newClientsThisMonth?: number;
  activeSipsMonthlyAmount?: number;
  avgAumYoYChangePercent?: number;
}

export type ArnClientSortKey = "name" | "aum" | "sipMonthly" | "xirr" | "lastTransactionAt";

export interface ArnClientsListParams {
  search?: string;
  kycStatus?: ArnKycStatus | "all";
  sipStatus?: ArnSipStatus | "all";
  page: number;
  pageSize: number;
  sortKey?: ArnClientSortKey;
  sortDirection?: "asc" | "desc";
}

export interface ArnPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ArnHolding {
  schemeName: string;
  category: string;
  value: string;
  valueRaw: number;
  xirr: number;
  allocationPercent: number;
}

export type ArnAssetAllocationKey = "equity" | "debt" | "gold";

export interface ArnAssetAllocationSlice {
  key: ArnAssetAllocationKey;
  label: string;
  percentage: number;
  currentValue: number;
}

export type ArnMfTransactionStatus =
  | "FULLY_SUCCESSFUL"
  | "PARTIALLY_SUCCESSFUL"
  | "FAILED"
  | "IN_PROCESS";

export type ArnMfOrderState = "submitted" | "failed" | "successful";

export interface ArnClientOrder {
  id: number;
  scheme: string;
  schemeName: string;
  state: ArnMfOrderState;
  amount: number;
  processedAmount: number;
  failureCode: string | null;
  lastError: string | null;
}

export interface ArnClientTransaction {
  transactionId: string;
  sipId: number | null;
  type: string;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  submittedOrders: number;
  totalAmount: number;
  processedAmount: number;
  status: ArnMfTransactionStatus;
  createdAt: string;
  orders: ArnClientOrder[];
}

export interface ArnGoal {
  name: string;
  saved: string;
  target: string;
  termName: string;
  progressPercent: number;
  nextInstallmentDate: string;
}

export interface ArnClientDetail {
  client: ArnClient;
  portfolioValue: string;
  gainLoss: string;
  gainLossPositive: boolean;
  xirr: number;
  monthlySip: string;
  nextSipDate: string;
  clientSince: string;
  sipActive: boolean;
  kycComplete: boolean;
  holdings: ArnHolding[];
  assetAllocation: ArnAssetAllocationSlice[];
  transactions: ArnClientTransaction[];
  goals: ArnGoal[];
}

export interface ArnActionResponse {
  ok: boolean;
  message: string;
}

// ---- Backend response types (internal) ----
export interface ArnClientsSummary {
  totalClients: number;
  newClientsThisMonth: number;
  activeSips: number;
  activeSipsMonthlyAmount: number;
  kycPending: number;
  avgAumPerClient: number;
  avgAumYoYChangePercent: number;
}

export interface ArnClientsBackendClient {
  userId: number;
  clientName: string;
  initials: string;
  mobileNumber: string;
  aum: number;
  sipMonthly: number;
  xirr: number;
  kycStatus: "Done" | "Pending";
  lastTransactionDate: string | null;
  investmentModel: string;
}

export interface ArnClientsBackendResponse {
  success: boolean;
  summary: ArnClientsSummary;
  clients: ArnClientsBackendClient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
  };
}

export interface ArnClientsFetchParams {
  search?: string;
  page: number;
  pageSize: number;
  type?: string;
  sortKey?: string;
  sortDirection?: string;
  kycStatus?: string;
  sipStatus?: string;
}

export interface ArnClientsFetchResult {
  summary: ArnClientsKpis;
  items: ArnClient[];
  total: number;
  page: number;
  pageSize: number;
  pagination: ArnClientsBackendResponse["pagination"];
}
