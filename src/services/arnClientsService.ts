import { ArnClientEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
import type {
  ArnActionResponse,
  ArnClient,
  ArnClientDetail,
  ArnClientSortKey,
  ArnClientsBackendClient,
  ArnClientsBackendResponse,
  ArnClientsFetchParams,
  ArnClientsFetchResult,
  ArnClientsKpis,
  ArnClientsListParams,
  ArnClientsSummary,
  ArnGoal,
  ArnHolding,
  ArnKycStatus,
  ArnPaginatedResponse,
  ArnSipStatus,
  ArnTone,
  ArnTransaction,
  ArnTransactionStatus,
  ArnTransactionType,
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

function normalizeTransactionType(value: unknown): "sip" | "lumpsum" | "redemption" | "switch" {
  const type = getString(value).toLowerCase();
  if (type === "lumpsum") return "lumpsum";
  if (type === "redemption") return "redemption";
  if (type === "switch") return "switch";
  return "sip";
}

function normalizeTransactionStatus(value: unknown): ArnTransactionStatus {
  const status = getString(value).toLowerCase();
  if (status === "pending") return "pending";
  if (status === "failed") return "failed";
  if (status === "processing") return "processing";
  return "done";
}

function normalizeClientDetailPayload(payload: unknown): ArnClientDetail {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const clientSource = getNestedRecord(data, "client") || data;
  const name = getString(clientSource.clientName || clientSource.name || clientSource.fullName, "Client");
  const kycStatus = normalizeKycStatus(getString(clientSource.kycStatus || clientSource.kyc, "pending"));
  const sipStatus = normalizeSipStatus(clientSource.sipStatus || clientSource.sip);
  const aumInPaise = getNumber(clientSource.aumInPaise || clientSource.aumValue || clientSource.aum, 0);
  const sipMonthlyInPaise = getNumber(clientSource.sipMonthlyInPaise || clientSource.sipMonthlyValue || clientSource.sipMonthly, 0);

  const rawLastTx = getString(clientSource.lastTransactionDate || clientSource.lastTransaction, "");
  const client: ArnClient = {
    id: getString(clientSource.userId !== undefined ? String(clientSource.userId) : clientSource.id || clientSource.clientId || clientSource._id, "client-1"),
    name,
    initials: getString(clientSource.initials, getInitials(name)),
    tone: normalizeTone(clientSource.tone || clientSource.color, toneOrder[0]),
    aum: formatCurrency(aumInPaise / 100),
    aumInPaise,
    sipMonthly: formatCurrency(sipMonthlyInPaise / 100),
    sipMonthlyInPaise,
    xirr: getNumber(clientSource.xirr, 0),
    kycStatus,
    kycLabel: getString(clientSource.kycStatus || clientSource.kyc, "Pending"),
    sipStatus,
    lastTransactionAt: rawLastTx || "—",
    lastTransactionLabel: formatDateLabel(rawLastTx || null),
  };

  const portfolioValueInPaise = getNumber(
    data.portfolioValueInPaise || data.portfolio_value_in_paise || data.portfolioValue || client.aumInPaise,
    client.aumInPaise
  );
  const monthlySipInPaise = getNumber(
    data.monthlySipInPaise || data.monthly_sip_in_paise || data.monthlySip || client.sipMonthlyInPaise,
    client.sipMonthlyInPaise
  );

  return {
    client,
    portfolioValue: getString(data.portfolioValueText || data.portfolio_value || data.portfolioValue, client.aum),
    portfolioValueInPaise,
    xirr: getNumber(data.xirr, client.xirr),
    monthlySip: getString(data.monthlySipText || data.monthly_sip || data.monthlySip, client.sipMonthly),
    monthlySipInPaise,
    nextSipDate: getString(data.nextSipDate || data.next_sip_date, "—"),
    clientSince: getString(data.clientSince || data.client_since, "—"),
    sipActive: getBoolean(data.sipActive || data.sip_active, client.sipStatus === "active"),
    kycComplete: getBoolean(data.kycComplete || data.kyc_complete, client.kycStatus === "done"),
    holdings: getArray(data.holdings, (item) => normalizeHolding(isRecord(item) ? item : {})),
    transactions: getArray(data.transactions, (item) => normalizeTransaction(isRecord(item) ? item : {})),
    goals: getArray(data.goals, (item) => normalizeGoal(isRecord(item) ? item : {})),
  };
}

function normalizeHolding(source: JsonObject): ArnHolding {
  const valueInPaise = getNumber(source.valueInPaise || source.value, 0);

  return {
    fundName: getString(source.fundName || source.fund, "Fund"),
    category: getString(source.category, "—"),
    assetClass: getString(source.assetClass || source.asset_class, "—"),
    value: getString(source.valueText || source.value, `₹${Math.round(valueInPaise / 100000)} L`),
    valueInPaise,
    xirr: getNumber(source.xirr, 0),
    tone: normalizeTone(source.tone || source.color, "amber"),
  };
}

function normalizeTransaction(source: JsonObject): ArnTransaction {
  const amountInPaise = getNumber(source.amountInPaise || source.amount, 0);
  const type = normalizeTransactionType(source.type);
  const status = normalizeTransactionStatus(source.status);
  const toneMap: Record<ArnTransactionType, ArnTone> = {
    sip: "blue",
    lumpsum: "purple",
    redemption: "red",
    switch: "teal",
  };

  return {
    date: getString(source.date, "—"),
    fundName: getString(source.fundName || source.fund, "Fund"),
    type,
    amount: getString(source.amountText || source.amount, `₹${amountInPaise.toLocaleString("en-IN")}`),
    amountInPaise,
    units: getString(source.units, "—"),
    status,
    tone: normalizeTone(source.tone || source.color, toneMap[type]),
  };
}

function normalizeGoal(source: JsonObject): ArnGoal {
  const savedInPaise = getNumber(source.savedInPaise || source.saved, 0);
  const targetInPaise = getNumber(source.targetInPaise || source.target, 0);

  return {
    name: getString(source.name, "Goal"),
    saved: getString(source.savedText || source.saved, `₹${Math.round(savedInPaise / 100000)} L`),
    savedInPaise,
    target: getString(source.targetText || source.target, `₹${Math.round(targetInPaise / 100000)} L`),
    targetInPaise,
    targetYear: getNumber(source.targetYear || source.year, 0),
    progress: getNumber(source.progress, 0),
    tone: normalizeTone(source.tone || source.color, "amber"),
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
