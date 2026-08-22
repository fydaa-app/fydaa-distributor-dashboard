type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getStockApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STOCK_API_URL || ""
  );
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (typeof document !== "undefined") {
    const match = document.cookie.match(/authToken=([^;]+)/);
    const authToken = match ? decodeURIComponent(match[1]) : "";
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

export interface FundOption {
  id: number | null;
  schemeName: string;
  fundName: string;
  stockName: string;
  name?: string;
  ticker: string;
  scheme: string;
  isin: string;
  schemeCode: string;
  selectedMfId: number | null;
  suggestedGoalName?: string;
}

export interface FundSearchResponse {
  success: boolean;
  stockType: string;
  stockTypeLabel: string;
  planType: string;
  search: string | null;
  totalItems: number;
  items: FundOption[];
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface GoalResponse {
  id: number;
  name: string;
  termId: number;
  termName: string;
  tenureMin: number;
  tenureMax: number;
  feePricing: number;
  goalAmountMin: number;
  goalAmountMax: number;
  description: string;
  items: object[];
  imageUrl: string;
  iconUrl: string;
}

export async function getAllGoals(): Promise<GoalResponse[]> {
  const url = `${getStockApiUrl()}/goal/getAllGoals`;
  return fetchJson<GoalResponse[]>(url);
}

export interface RecommendedPortfolioResponse {
  userId: number;
  goalId: number;
  investmentModel: string | null;
  planType: string;
  risk: {
    totalPointsRaw: number;
    normalizedPoints0To100: number;
    riskScoreBucket: number;
    isDefault: boolean;
  };
  goal: {
    id: number;
    name: string;
    termId: number;
    termLabel: string | null;
    expectedAnnualReturnPercent: number | null;
  } | null;
  portfolio: {
    id: number;
    portfolioName: string;
    planId: number;
    planType: string;
    termId: number;
    riskScore: number;
    portfolioType: string;
    minimumInvestment: number;
    orderAmount: number;
    mfId: string | null;
    weights: string;
    assetClass: Record<string, number>;
    expectedAnnualReturnPercent: number | null;
  };
  assetClassAllocation: { bucket: string; percent: number }[];
  schemeAllocations: Array<{
    mutualFundId: number;
    assetBucket: string;
    weightPercent: number;
    ticker?: string;
    stockName?: string;
    StockType?: string;
    CapType?: string;
    returns?: string;
    riskType?: string;
  }>;
}

export async function getRecommendedPortfolio(
  userId: number,
  goalId: number
): Promise<RecommendedPortfolioResponse> {
  const url = `${getStockApiUrl()}/mutualFund/recommended-portfolio-for-user?userId=${userId}&goalId=${goalId}`;
  return fetchJson<RecommendedPortfolioResponse>(url);
}

export async function searchFunds(params: {
  stockType: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<FundSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("stockType", params.stockType);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 20));
  if (params.search) searchParams.set("search", params.search);

  const url = `${getStockApiUrl()}/mutualFund/search?${searchParams.toString()}`;
  return fetchJson<FundSearchResponse>(url);
}

export interface SearchTypeOption {
  label: string;
  value: string;
}

export interface SearchTypeResponse {
  options: SearchTypeOption[];
}

export async function getSearchTypes(): Promise<SearchTypeResponse> {
  const url = `${getStockApiUrl()}/mutualFund/search/types`;
  return fetchJson<SearchTypeResponse>(url);
}

export interface AllFundSearchResponse {
  items: FundOption[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
  [key: string]: unknown;
}

export async function searchAllFunds(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AllFundSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("limit", String(params.limit ?? 20));
  if (params.search) searchParams.set("search", params.search);

  const url = `${getStockApiUrl()}/mutualFund/finprim-search-for-user?${searchParams.toString()}`;
  return fetchJson<AllFundSearchResponse>(url);
}
