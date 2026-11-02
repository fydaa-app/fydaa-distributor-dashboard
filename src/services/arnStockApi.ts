type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function readApiMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  const data = payload.data;
  if (isRecord(data) && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  return fallback;
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
    throw new Error(readApiMessage(payload, "Request failed. Please try again."));
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
  /** Local MutualFunds PK from finprim / All-chip search (same as consumer). */
  localMfId?: number | null;
  mfId?: number | null;
  suggestedGoalId?: number;
  suggestedGoalName?: string;
  stockType?: string;
  fund_category?: string;
  minInitialInvestment?: number;
  minSipAmount?: number;
  sipAllowed?: boolean;
  purchaseAllowed?: boolean;
  sip_allowed?: boolean;
  purchase_allowed?: boolean;
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
  goalId: number | null;
  basketId?: number | null;
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
  basket?: {
    id: number;
    name: string;
    type?: string;
    investmentMode?: string | null;
    investAmount?: number | null;
    minInvestment?: number;
  } | null;
  portfolio: {
    id: number | null;
    portfolioName: string;
    planId?: number;
    planType: string;
    termId?: number;
    riskScore?: number;
    portfolioType?: string;
    minimumInvestment?: number;
    orderAmount?: number;
    mfId: string | null;
    weights: string;
    assetClass?: Record<string, number>;
    expectedAnnualReturnPercent?: number | null;
  } | null;
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
    minInitialInvestment?: number;
    minSipAmount?: number;
  }>;
}

export async function getRecommendedPortfolio(
  userId: number,
  goalIdOrOptions: number | { goalId?: number; basketId?: number }
): Promise<RecommendedPortfolioResponse> {
  const params = new URLSearchParams();
  params.set("userId", String(userId));

  if (typeof goalIdOrOptions === "number") {
    params.set("goalId", String(goalIdOrOptions));
  } else if (goalIdOrOptions.basketId) {
    params.set("basketId", String(goalIdOrOptions.basketId));
  } else if (goalIdOrOptions.goalId) {
    params.set("goalId", String(goalIdOrOptions.goalId));
  } else {
    throw new Error("goalId or basketId is required");
  }

  const url = `${getStockApiUrl()}/mutualFund/recommended-portfolio-for-user?${params.toString()}`;
  return fetchJson<RecommendedPortfolioResponse>(url);
}

export type BasketInvestmentMode = "SIP" | "LUMPSUM";

export interface BasketFund {
  mfId: number;
  scheme?: string | null;
  fundName?: string | null;
  weight: number;
  minSipAmount?: number;
  minInitialInvestment?: number;
  stockType?: string;
  sipAllowed?: boolean;
  purchaseAllowed?: boolean;
}

export interface BasketItem {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  type?: "DEFAULT" | "CUSTOM" | string;
  isDefault?: boolean;
  userId?: number | null;
  assetClassGoalId?: number | null;
  assetClassGoal?: { id: number; name: string } | null;
  funds: BasketFund[];
  investmentMode?: BasketInvestmentMode | null;
  investAmount?: number | null;
  minInvestment?: number;
  sipStatus?: string | null;
  canEditFunds?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

function unwrapBasketList(payload: unknown): BasketItem[] {
  if (Array.isArray(payload)) return payload as BasketItem[];
  if (!isRecord(payload)) return [];
  const candidates = [payload.data, payload.baskets, payload.items, payload.results, payload.list];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as BasketItem[];
    if (isRecord(candidate)) {
      const nested = unwrapBasketList(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
}

function unwrapBasket(payload: unknown): BasketItem | null {
  if (!payload) return null;
  if (isRecord(payload) && typeof payload.id === "number") {
    return payload as unknown as BasketItem;
  }
  if (!isRecord(payload)) return null;
  const data = payload.data;
  if (isRecord(data) && isRecord(data.basket)) {
    return data.basket as unknown as BasketItem;
  }
  if (isRecord(data) && typeof data.id === "number") {
    return data as unknown as BasketItem;
  }
  if (isRecord(payload.basket)) {
    return payload.basket as unknown as BasketItem;
  }
  const list = unwrapBasketList(payload);
  return list[0] ?? null;
}

export async function getBasketDefaults(
  assetClassGoalId?: number
): Promise<BasketItem[]> {
  const params = new URLSearchParams();
  if (assetClassGoalId) params.set("assetClassGoalId", String(assetClassGoalId));
  const qs = params.toString();
  const url = `${getStockApiUrl()}/basket/defaults${qs ? `?${qs}` : ""}`;
  const payload = await fetchJson<unknown>(url);
  return unwrapBasketList(payload).filter((b) => Number(b.id) > 0);
}

export async function getMyBasketsForUser(
  userId: number,
  investmentMode?: BasketInvestmentMode
): Promise<BasketItem[]> {
  const params = new URLSearchParams();
  params.set("userId", String(userId));
  if (investmentMode) params.set("investmentMode", investmentMode);
  const url = `${getStockApiUrl()}/basket/my-for-user?${params.toString()}`;
  const payload = await fetchJson<unknown>(url);
  return unwrapBasketList(payload).filter((b) => Number(b.id) > 0);
}

export async function getBasketForUser(
  userId: number,
  basketId: number
): Promise<BasketItem> {
  const url = `${getStockApiUrl()}/basket/${basketId}/for-user?userId=${userId}`;
  const payload = await fetchJson<unknown>(url);
  const basket = unwrapBasket(payload);
  if (!basket) throw new Error("Basket not found");
  return basket;
}

export interface CustomBasketFundInput {
  mfId: number;
  scheme?: string;
  weight: number;
}

export interface CreateCustomBasketPayload {
  name: string;
  description?: string;
  investmentMode: BasketInvestmentMode;
  investAmount: number;
  funds: CustomBasketFundInput[];
}

export async function createCustomBasketForUser(
  userId: number,
  payload: CreateCustomBasketPayload
): Promise<BasketItem> {
  const url = `${getStockApiUrl()}/basket/custom-for-user`;
  const response = await fetchJson<unknown>(url, {
    method: "POST",
    body: JSON.stringify({ ...payload, userId }),
  });
  const basket = unwrapBasket(response);
  if (!basket) throw new Error("Failed to create basket");
  return basket;
}

export async function updateCustomBasketForUser(
  userId: number,
  basketId: number,
  payload: Partial<CreateCustomBasketPayload>
): Promise<BasketItem> {
  const url = `${getStockApiUrl()}/basket/custom-for-user/${basketId}`;
  const response = await fetchJson<unknown>(url, {
    method: "PATCH",
    body: JSON.stringify({ ...payload, userId }),
  });
  const basket = unwrapBasket(response);
  if (!basket) throw new Error("Failed to update basket");
  return basket;
}

export async function deleteCustomBasketForUser(
  userId: number,
  basketId: number
): Promise<void> {
  const url = `${getStockApiUrl()}/basket/custom-for-user/${basketId}?userId=${userId}`;
  await fetchJson<unknown>(url, { method: "DELETE" });
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

export type SharePortfolioChannel = "whatsapp" | "email";

export async function sharePortfolio(
  userId: number,
  channel: SharePortfolioChannel
): Promise<string> {
  const path =
    channel === "whatsapp"
      ? "/portfolio/share-portfolio-whatsapp"
      : "/portfolio/share-portfolio-email";
  const payload = await fetchJson<unknown>(`${getStockApiUrl()}${path}`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  const fallback =
    channel === "whatsapp"
      ? "Portfolio shared on WhatsApp."
      : "Portfolio shared by email.";
  return readApiMessage(payload, fallback);
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
