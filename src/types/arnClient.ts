export type ArnTone = "amber" | "green" | "blue" | "red" | "purple" | "teal";

export type ArnKycStatus = "done" | "pending" | "not-started" | "expired";

export type ArnSipStatus = "active" | "paused" | "at-risk" | "due-today" | "none";

export type ArnTransactionType = "sip" | "lumpsum" | "redemption" | "switch";

export type ArnTransactionStatus = "done" | "pending" | "failed" | "processing";

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
  fundName: string;
  category: string;
  assetClass: string;
  value: string;
  valueInPaise: number;
  xirr: number;
  tone: ArnTone;
}

export interface ArnTransaction {
  date: string;
  fundName: string;
  type: ArnTransactionType;
  amount: string;
  amountInPaise: number;
  units: string;
  status: ArnTransactionStatus;
  tone: ArnTone;
}

export interface ArnGoal {
  name: string;
  saved: string;
  savedInPaise: number;
  target: string;
  targetInPaise: number;
  targetYear: number;
  progress: number;
  tone: ArnTone;
}

export interface ArnClientDetail {
  client: ArnClient;
  portfolioValue: string;
  portfolioValueInPaise: number;
  xirr: number;
  monthlySip: string;
  monthlySipInPaise: number;
  nextSipDate: string;
  clientSince: string;
  sipActive: boolean;
  kycComplete: boolean;
  holdings: ArnHolding[];
  transactions: ArnTransaction[];
  goals: ArnGoal[];
}

export interface ArnActionResponse {
  ok: boolean;
  message: string;
}
