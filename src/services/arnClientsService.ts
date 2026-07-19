import { ArnClientEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
import type {
  ArnActionResponse,
  ArnAssetAllocationKey,
  ArnAssetAllocationSlice,
  ArnClient,
  ArnClientDetail,
  ArnClientOrder,
  ArnClientSortKey,
  ArnClientsBackendClient,
  ArnClientsBackendResponse,
  ArnClientsFetchParams,
  ArnClientsFetchResult,
  ArnClientsKpis,
  ArnClientsListParams,
  ArnClientsSummary,
  ArnClientTransaction,
  ArnGoal,
  ArnHolding,
  ArnKycStatus,
  ArnMfOrderState,
  ArnMfTransactionStatus,
  ArnPaginatedResponse,
  ArnSipStatus,
  ArnTone,
} from "@/types/arnClient";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function getNestedRecord(source: JsonObject | undefined, key: string): JsonObject | undefined {
  return source && isRecord(source[key]) ? source[key] : undefined;
}

function getArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(mapper);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const toneOrder: ArnTone[] = ["amber", "blue", "green", "teal", "purple", "red"];

function formatCurrency(value: number): string {
  if (value === 0) return "₹0";
  if (value < 100000) return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (value < 10000000) {
    const lakhs = value / 100000;
    return `₹${Math.round(lakhs * 10) / 10} L`;
  }
  const crores = value / 10000000;
  return `₹${Math.round(crores * 10) / 10} Cr`;
}

function formatDateLabel(date: string | null): string {
  if (!date) return "No tx yet";
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "No tx yet";
    return parsed.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch {
    return "No tx yet";
  }
}

function normalizeKycStatus(status: string): ArnKycStatus {
  const normalized = status.toLowerCase();
  if (normalized === "done") return "done";
  if (normalized === "pending") return "pending";
  if (normalized === "expired") return "expired";
  if (normalized === "not-started" || normalized === "not started") return "not-started";
  return "pending";
}

function normalizeSummary(summary: ArnClientsSummary | undefined): ArnClientsKpis {
  if (!summary) {
    return {
      totalClients: 0,
      activeSips: 0,
      kycPending: 0,
      avgAumPerClient: "₹0",
    };
  }

  return {
    totalClients: summary.totalClients,
    activeSips: summary.activeSips,
    kycPending: summary.kycPending,
    avgAumPerClient: formatCurrency(summary.avgAumPerClient),
    newClientsThisMonth: summary.newClientsThisMonth,
    activeSipsMonthlyAmount: summary.activeSipsMonthlyAmount,
    avgAumYoYChangePercent: summary.avgAumYoYChangePercent,
  };
}

function normalizeClient(row: ArnClientsBackendClient): ArnClient {
  const id = String(row.userId);
  const name = row.clientName || "Unknown";
  const aumInPaise = Math.round(row.aum * 100);
  const sipMonthlyInPaise = Math.round(row.sipMonthly * 100);
  const kycStatus = normalizeKycStatus(row.kycStatus);
  const sipStatus: ArnSipStatus = row.sipMonthly > 0 ? "active" : "none";

  return {
    id,
    name,
    initials: row.initials || getInitials(name),
    tone: toneOrder[row.userId % toneOrder.length],
    aum: formatCurrency(row.aum),
    aumInPaise,
    sipMonthly: formatCurrency(row.sipMonthly),
    sipMonthlyInPaise,
    xirr: row.xirr ?? 0,
    kycStatus,
    kycLabel: row.kycStatus,
    sipStatus,
    lastTransactionAt: row.lastTransactionDate ?? "—",
    lastTransactionLabel: formatDateLabel(row.lastTransactionDate),
  };
}

function normalizeTone(value: unknown, fallback: ArnTone = "amber"): ArnTone {
  const tone = getString(value);
  return ["amber", "green", "blue", "red", "purple", "teal"].includes(tone)
    ? (tone as ArnTone)
    : fallback;
}

function normalizeSipStatus(value: unknown): ArnSipStatus {
  const status = getString(value).toLowerCase();
  if (status === "paused") return "paused";
  if (status === "at-risk" || status === "risk" || status === "at risk") return "at-risk";
  if (status === "due-today" || status === "due today") return "due-today";
  if (status === "none") return "none";
  return "active";
}

function normalizeMfTransactionStatus(value: unknown): ArnMfTransactionStatus {
  const status = getString(value).toUpperCase();
  if (status === "FULLY_SUCCESSFUL") return "FULLY_SUCCESSFUL";
  if (status === "PARTIALLY_SUCCESSFUL") return "PARTIALLY_SUCCESSFUL";
  if (status === "FAILED") return "FAILED";
  return "IN_PROCESS";
}

function normalizeMfOrderState(value: unknown): ArnMfOrderState {
  const state = getString(value).toLowerCase();
  if (state === "successful") return "successful";
  if (state === "failed") return "failed";
  return "submitted";
}

function normalizeClientDetailPayload(payload: unknown): ArnClientDetail {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const clientSource = getNestedRecord(data, "client") || {};
  const summary = getNestedRecord(data, "summary") || {};

  const name = getString(clientSource.name || clientSource.clientName || clientSource.fullName, "Client");
  const kycStatusRaw = getString(clientSource.kycStatus || clientSource.kyc, "pending");
  const kycStatus = normalizeKycStatus(kycStatusRaw === "complete" ? "done" : kycStatusRaw);
  const sipStatus = normalizeSipStatus(clientSource.sipStatus || clientSource.sip);
  const userId = clientSource.userId !== undefined ? String(clientSource.userId) : "";

  const portfolioValueRaw = getNumber(summary.portfolioValue, 0);
  const monthlySipRaw = getNumber(summary.monthlySip, 0);
  const gainLossRaw = getNumber(summary.gainLoss, 0);

  const client: ArnClient = {
    id: getString(userId || clientSource.id || clientSource.clientId, "client-1"),
    name,
    initials: getString(clientSource.initials, getInitials(name)),
    tone: normalizeTone(clientSource.tone || clientSource.color, toneOrder[0]),
    aum: getString(summary.portfolioValueFormatted, formatCurrency(portfolioValueRaw)),
    aumInPaise: Math.round(portfolioValueRaw * 100),
    sipMonthly: getString(summary.monthlySipFormatted, formatCurrency(monthlySipRaw)),
    sipMonthlyInPaise: Math.round(monthlySipRaw * 100),
    xirr: getNumber(summary.xirr, 0),
    kycStatus,
    kycLabel: kycStatusRaw,
    sipStatus,
    lastTransactionAt: "—",
    lastTransactionLabel: "—",
  };

  return {
    client,
    portfolioValue: getString(summary.portfolioValueFormatted, formatCurrency(portfolioValueRaw)),
    gainLoss: getString(summary.gainLossFormatted, formatCurrency(gainLossRaw)),
    gainLossPositive: gainLossRaw >= 0,
    xirr: getNumber(summary.xirr, 0),
    monthlySip: getString(summary.monthlySipFormatted, formatCurrency(monthlySipRaw)),
    nextSipDate: getString(summary.nextSipDate, "—"),
    clientSince: getString(clientSource.clientSince, "—"),
    sipActive: sipStatus === "active",
    kycComplete: kycStatus === "done",
    holdings: getArray(data.holdings, (item) => normalizeHolding(isRecord(item) ? item : {})),
    assetAllocation: normalizeAssetAllocation(getNestedRecord(data, "assetAllocation")),
    transactions: getArray(data.transactions, (item) => normalizeClientTransaction(isRecord(item) ? item : {})),
    goals: getArray(data.goals, (item) => normalizeGoal(isRecord(item) ? item : {})),
  };
}

function normalizeAssetAllocation(source: JsonObject | undefined): ArnAssetAllocationSlice[] {
  const src = source || {};
  const mapping: Array<{ key: ArnAssetAllocationKey; label: string; field: string }> = [
    { key: "equity", label: "Equity", field: "IndianStock" },
    { key: "debt", label: "Debt", field: "FixedIncomeBonds" },
    { key: "gold", label: "Gold", field: "Gold" },
  ];

  const raw = mapping.map((item) => {
    const bucket = getNestedRecord(src, item.field) || {};
    return {
      key: item.key,
      label: item.label,
      currentValue: getNumber(bucket.currentValue, 0),
    };
  });

  const total = raw.reduce((sum, item) => sum + item.currentValue, 0);

  return raw.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.currentValue / total) * 100) : 0,
  }));
}

function normalizeHolding(source: JsonObject): ArnHolding {
  const valueRaw = getNumber(source.value, 0);

  return {
    schemeName: getString(source.schemeName || source.fundName || source.fund, "Fund"),
    category: getString(source.category, "—"),
    value: getString(source.valueFormatted, formatCurrency(valueRaw)),
    valueRaw,
    xirr: getNumber(source.xirr, 0),
    allocationPercent: getNumber(source.allocationPercent, 0),
  };
}

function normalizeClientOrder(source: JsonObject): ArnClientOrder {
  return {
    id: getNumber(source.id, 0),
    scheme: getString(source.scheme, "—"),
    schemeName: getString(source.schemeName, "—"),
    state: normalizeMfOrderState(source.state),
    amount: getNumber(source.amount, 0),
    processedAmount: getNumber(source.processed_amount ?? source.processedAmount, 0),
    failureCode: getString(source.failure_code ?? source.failureCode, "") || null,
    lastError: getString(source.last_error ?? source.lastError, "") || null,
  };
}

function normalizeClientTransaction(source: JsonObject): ArnClientTransaction {
  return {
    transactionId: getString(source.transactionId, "—"),
    sipId: source.sipId !== undefined && source.sipId !== null ? getNumber(source.sipId, 0) : null,
    type: getString(source.type, ""),
    totalOrders: getNumber(source.totalOrders, 0),
    successfulOrders: getNumber(source.successfulOrders, 0),
    failedOrders: getNumber(source.failedOrders, 0),
    submittedOrders: getNumber(source.submittedOrders, 0),
    totalAmount: getNumber(source.totalAmount, 0),
    processedAmount: getNumber(source.processedAmount, 0),
    status: normalizeMfTransactionStatus(source.status),
    createdAt: getString(source.createdAt, ""),
    orders: getArray(source.orders, (item) => normalizeClientOrder(isRecord(item) ? item : {})),
  };
}

function formatGoalDate(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeGoal(source: JsonObject): ArnGoal {
  const savedRaw = getNumber(source.saved, 0);
  const targetRaw = getNumber(source.targetAmount ?? source.target, 0);

  return {
    name: getString(source.name, "Goal"),
    saved: getString(source.savedFormatted, formatCurrency(savedRaw)),
    target: getString(source.targetFormatted, formatCurrency(targetRaw)),
    termName: getString(source.termName, ""),
    progressPercent: getNumber(source.progressPercent ?? source.progress, 0),
    nextInstallmentDate: formatGoalDate(getString(source.nextInstallmentDate, "")),
  };
}

function normalizeActionResponse(payload: unknown): ArnActionResponse {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};

  return {
    ok: getBoolean(data.ok, true),
    message: getString(data.message, "Action completed."),
  };
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const authToken = getCookie("authToken");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

function replacePathParams(path: string, params: Record<string, string>): string {
  return Object.entries(params).reduce((url, [key, value]) => url.replace(`{${key}}`, value), path);
}

export async function fetchClients(params: ArnClientsFetchParams): Promise<ArnClientsFetchResult> {
  return fetchClientsImpl(params);
}

export async function getArnClients(
  params: ArnClientsListParams
): Promise<ArnPaginatedResponse<ArnClient>> {
  const result = await fetchClientsImpl({
    search: params.search,
    page: params.page,
    pageSize: params.pageSize || 5,
    type: "individual",
    sortKey: params.sortKey,
    sortDirection: params.sortDirection,
    kycStatus: params.kycStatus,
    sipStatus: params.sipStatus,
  });

  return {
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

async function fetchClientsImpl(params: ArnClientsFetchParams): Promise<ArnClientsFetchResult> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(Math.min(50, params.pageSize || 5)));
  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);

  const payload = await fetchJson<ArnClientsBackendResponse>(
    `${getApiUrl()}${ArnClientEndpoints.CLIENTS}?${searchParams.toString()}`
  );

  const summary = normalizeSummary(payload.summary);
  const items = (payload.clients || []).map((row) => normalizeClient(row));
  const pagination = payload.pagination || {
    currentPage: params.page,
    totalPages: 1,
    totalItems: items.length,
    itemsPerPage: params.pageSize || 5,
    hasMore: false,
  };

  return {
    summary,
    items,
    total: pagination.totalItems,
    page: pagination.currentPage,
    pageSize: pagination.itemsPerPage,
    pagination,
  };
}

export async function getArnClientDetail(clientId: string, signal?: AbortSignal): Promise<ArnClientDetail> {
  const endpoint = replacePathParams(ArnClientEndpoints.CLIENT_DETAIL, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, { signal });

  return normalizeClientDetailPayload(payload);
}

export async function shareArnClientReport(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  const endpoint = replacePathParams(ArnClientEndpoints.SHARE_REPORT, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, {
    method: "POST",
    signal,
  });

  return normalizeActionResponse(payload);
}

export async function createArnClientSipRequest(clientId: string, signal?: AbortSignal): Promise<ArnActionResponse> {
  const endpoint = replacePathParams(ArnClientEndpoints.NEW_SIP, { clientId });
  const payload = await fetchJson<unknown>(`${getApiUrl()}${endpoint}`, {
    method: "POST",
    signal,
  });

  return normalizeActionResponse(payload);
}

export type { ArnClientSortKey };
