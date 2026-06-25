import { ArnCommissionEndpoints } from "@/config/api-endpoints";
import type { ArnPaginatedResponse } from "@/types/arnClient";
import type { ArnTone } from "@/types/arnClient";
import type {
  ArnAmcSplit,
  ArnCommissionKpis,
  ArnCommissionLedgerItem,
  ArnCommissionListParams,
  ArnCommissionResponse,
  ArnCommissionStatus,
  ArnCommissionTrendPoint,
} from "@/types/arnCommission";

type JsonObject = Record<string, unknown>;

const PAGE_SIZE = 5;
//const toneOrder: ArnTone[] = ["amber", "blue", "green", "purple", "teal", "red"];

const statusLabels: Record<ArnCommissionStatus, string> = {
  paid: "Paid",
  processing: "Processing",
  pending: "Pending",
  failed: "Failed",
};

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

function getNestedRecord(source: JsonObject | undefined, key: string): JsonObject | undefined {
  return source && isRecord(source[key]) ? source[key] : undefined;
}

function getArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(mapper);
}

// function formatPaise(value: number): string {
//   return `₹${Math.abs(value).toLocaleString("en-IN")}`;
// }

// function formatCr(value: number): string {
//   return `₹${(value / 10000000).toFixed(2).replace(".00", "")} Cr`;
// }

function normalizeTone(value: unknown, fallback: ArnTone = "amber"): ArnTone {
  const tone = getString(value).toLowerCase();
  return ["amber", "green", "blue", "red", "purple", "teal"].includes(tone) ? (tone as ArnTone) : fallback;
}

function normalizeStatus(value: unknown): ArnCommissionStatus {
  const status = getString(value).toLowerCase();
  if (status === "paid" || status === "settled" || status === "credited") return "paid";
  if (status === "processing" || status === "in-progress" || status === "in progress") return "processing";
  if (status === "pending" || status === "awaiting" || status === "due") return "pending";
  if (status === "failed" || status === "fail" || status === "error") return "failed";
  return "pending";
}

const dummyKpis: ArnCommissionKpis = {
  trailMay: "₹34,200",
  trailMayInPaise: 34200,
  fy26Total: "₹3.42 L",
  fy26TotalInPaise: 342000,
  effectiveTrailRate: "0.82%",
  trendText: "+6.1% vs Apr",
};

const dummyTrend: ArnCommissionTrendPoint[] = [
  { month: "Jan", value: "₹28,500", valueInPaise: 28500 },
  { month: "Feb", value: "₹29,700", valueInPaise: 29700 },
  { month: "Mar", value: "₹30,200", valueInPaise: 30200 },
  { month: "Apr", value: "₹32,100", valueInPaise: 32100 },
  { month: "May", value: "₹32,230", valueInPaise: 32230 },
  { month: "Jun", value: "₹34,200", valueInPaise: 34200 },
];

const dummyAmcSplit: ArnAmcSplit[] = [
  { amc: "Mirae", label: "Mirae", percentage: 34, valueInPaise: 11628, tone: "amber" },
  { amc: "P.Parikh", label: "P.Parikh", percentage: 28, valueInPaise: 9576, tone: "blue" },
  { amc: "HDFC", label: "HDFC", percentage: 21, valueInPaise: 7182, tone: "green" },
  { amc: "ICICI", label: "ICICI", percentage: 17, valueInPaise: 5814, tone: "purple" },
];

const dummyLedger: ArnCommissionLedgerItem[] = [
  {
    id: "commission-jun-2026",
    month: "Jun 2026",
    monthKey: "2026-06",
    aum: "₹4.18 Cr",
    aumInPaise: 41800000,
    trail: "₹34,200",
    trailInPaise: 34200,
    upfront: "₹2,400",
    upfrontInPaise: 2400,
    total: "₹36,600",
    totalInPaise: 36600,
    status: "processing",
    statusLabel: "Processing",
    actionLabel: "Track",
  },
  {
    id: "commission-may-2026",
    month: "May 2026",
    monthKey: "2026-05",
    aum: "₹3.94 Cr",
    aumInPaise: 39400000,
    trail: "₹32,230",
    trailInPaise: 32230,
    upfront: "₹1,800",
    upfrontInPaise: 1800,
    total: "₹34,030",
    totalInPaise: 34030,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-apr-2026",
    month: "Apr 2026",
    monthKey: "2026-04",
    aum: "₹3.71 Cr",
    aumInPaise: 37100000,
    trail: "₹30,390",
    trailInPaise: 30390,
    upfront: "₹3,200",
    upfrontInPaise: 3200,
    total: "₹33,590",
    totalInPaise: 33590,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-mar-2026",
    month: "Mar 2026",
    monthKey: "2026-03",
    aum: "₹3.48 Cr",
    aumInPaise: 34800000,
    trail: "₹28,500",
    trailInPaise: 28500,
    upfront: "₹1,200",
    upfrontInPaise: 1200,
    total: "₹29,700",
    totalInPaise: 29700,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-feb-2026",
    month: "Feb 2026",
    monthKey: "2026-02",
    aum: "₹3.26 Cr",
    aumInPaise: 32600000,
    trail: "₹29,700",
    trailInPaise: 29700,
    upfront: "₹2,100",
    upfrontInPaise: 2100,
    total: "₹31,800",
    totalInPaise: 31800,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-jan-2026",
    month: "Jan 2026",
    monthKey: "2026-01",
    aum: "₹3.08 Cr",
    aumInPaise: 30800000,
    trail: "₹28,500",
    trailInPaise: 28500,
    upfront: "₹1,600",
    upfrontInPaise: 1600,
    total: "₹30,100",
    totalInPaise: 30100,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-dec-2025",
    month: "Dec 2025",
    monthKey: "2025-12",
    aum: "₹2.92 Cr",
    aumInPaise: 29200000,
    trail: "₹26,900",
    trailInPaise: 26900,
    upfront: "₹2,900",
    upfrontInPaise: 2900,
    total: "₹29,800",
    totalInPaise: 29800,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
  {
    id: "commission-nov-2025",
    month: "Nov 2025",
    monthKey: "2025-11",
    aum: "₹2.75 Cr",
    aumInPaise: 27500000,
    trail: "₹24,800",
    trailInPaise: 24800,
    upfront: "₹1,500",
    upfrontInPaise: 1500,
    total: "₹26,300",
    totalInPaise: 26300,
    status: "paid",
    statusLabel: "Paid",
    actionLabel: "Download",
  },
];

function getDummyKpis(): ArnCommissionKpis {
  return dummyKpis;
}

function getDummyTrend(): ArnCommissionTrendPoint[] {
  return dummyTrend;
}

function getDummyAmcSplit(): ArnAmcSplit[] {
  return dummyAmcSplit;
}

function getDummyLedger(params: ArnCommissionListParams): ArnPaginatedResponse<ArnCommissionLedgerItem> {
  const search = (params.search || "").trim().toLowerCase();
  const status = params.status || "all";
  const month = (params.month || "").trim().toLowerCase();
  let items = [...dummyLedger];

  if (search) {
    items = items.filter((item) => `${item.month} ${item.aum} ${item.trail} ${item.statusLabel}`.toLowerCase().includes(search));
  }

  if (status !== "all") {
    items = items.filter((item) => item.status === status);
  }

  if (month) {
    items = items.filter((item) => item.monthKey === month);
  }

  const sortKey = params.sortKey || "month";
  const sortDirection = params.sortDirection || "desc";

  items.sort((a, b) => {
    let aValue: string | number = a[sortKey as keyof ArnCommissionLedgerItem];
    let bValue: string | number = b[sortKey as keyof ArnCommissionLedgerItem];

    if (sortKey === "aum") {
      aValue = a.aumInPaise;
      bValue = b.aumInPaise;
    }

    if (sortKey === "trail") {
      aValue = a.trailInPaise;
      bValue = b.trailInPaise;
    }

    if (sortKey === "upfront") {
      aValue = a.upfrontInPaise;
      bValue = b.upfrontInPaise;
    }

    if (sortKey === "total") {
      aValue = a.totalInPaise;
      bValue = b.totalInPaise;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
      : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
  });

  const total = items.length;
  const page = Math.max(1, params.page);
  const pageSize = params.pageSize || PAGE_SIZE;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

function getDummyCommissionResponse(params: ArnCommissionListParams): ArnCommissionResponse {
  const paginatedLedger = getDummyLedger(params);

  return {
    ...dummyKpis,
    trend: dummyTrend,
    amcSplit: dummyAmcSplit,
    ledger: paginatedLedger.items,
    total: paginatedLedger.total,
    page: paginatedLedger.page,
    pageSize: paginatedLedger.pageSize,
  };
}

function normalizeKpisPayload(payload: unknown): ArnCommissionKpis {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const trailMayInPaise = getNumber(data.trailMayInPaise || data.trail_may_in_paise || data.trailMay, 0);
  const fy26TotalInPaise = getNumber(data.fy26TotalInPaise || data.fy26_total_in_paise || data.fy26Total, 0);

  return {
    trailMay: getString(data.trailMayText || data.trail_may_text || data.trailMay, `₹${trailMayInPaise.toLocaleString("en-IN")}`),
    trailMayInPaise,
    fy26Total: getString(data.fy26TotalText || data.fy26_total_text || data.fy26Total, `₹${Math.round(fy26TotalInPaise / 100000)} L`),
    fy26TotalInPaise,
    effectiveTrailRate: getString(data.effectiveTrailRate || data.effective_trail_rate || data.effectiveTrail, "0.82%"),
    trendText: getString(data.trendText || data.trend_text || data.trend, "+6.1% vs Apr"),
  };
}

function normalizeTrendPayload(payload: unknown): ArnCommissionTrendPoint[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.trend || data.items || data.points, (item) => {
    const source = isRecord(item) ? item : {};
    const valueInPaise = getNumber(source.valueInPaise || source.value || source.trailInPaise || source.trail, 0);

    return {
      month: getString(source.month || source.label, "—"),
      value: getString(source.valueText || source.valueText || source.value, `₹${valueInPaise.toLocaleString("en-IN")}`),
      valueInPaise,
    };
  });
}

function normalizeAmcSplitPayload(payload: unknown): ArnAmcSplit[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.amcSplit || data.amc_split || data.items || data.split, (item) => {
    const source = isRecord(item) ? item : {};
    const valueInPaise = getNumber(source.valueInPaise || source.value, 0);

    return {
      amc: getString(source.amc || source.name || source.label, "AMC"),
      label: getString(source.label || source.amc, getString(source.amc || source.name || source.label, "AMC")),
      percentage: getNumber(source.percentage || source.percent, 0),
      valueInPaise,
      tone: normalizeTone(source.tone || source.color),
    };
  });
}

function normalizeLedgerPayload(payload: unknown): ArnPaginatedResponse<ArnCommissionLedgerItem> {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const items = getArray(data.ledger || data.items || data.results, (item) => {
    const source = isRecord(item) ? item : {};
    const status = normalizeStatus(source.status || source.paymentStatus);
    const trailInPaise = getNumber(source.trailInPaise || source.trail, 0);
    const upfrontInPaise = getNumber(source.upfrontInPaise || source.upfront, 0);
    const totalInPaise = getNumber(source.totalInPaise || source.total || trailInPaise + upfrontInPaise);
    const month = getString(source.month || source.monthLabel || source.period, "Month");

    return {
      id: getString(source.id || source.ledgerId || source._id, `commission-${month}`),
      month,
      monthKey: getString(source.monthKey || source.month_key || month.toLowerCase().replace(/\s+/g, "-")),
      aum: getString(source.aumText || source.aum || source.averageAum, "—"),
      aumInPaise: getNumber(source.aumInPaise || source.aum || source.averageAumInPaise || source.average_aum_in_paise, 0),
      trail: getString(source.trailText || source.trail, `₹${trailInPaise.toLocaleString("en-IN")}`),
      trailInPaise,
      upfront: getString(source.upfrontText || source.upfront, `₹${upfrontInPaise.toLocaleString("en-IN")}`),
      upfrontInPaise,
      total: getString(source.totalText || source.total, `₹${totalInPaise.toLocaleString("en-IN")}`),
      totalInPaise,
      status,
      statusLabel: getString(source.statusLabel || source.status_label || source.statusText, statusLabels[status]),
      actionLabel: getString(source.actionLabel || source.action_label || (status === "paid" ? "Download" : "Track")),
    };
  });
  const total = getNumber(data.total, items.length);
  const page = getNumber(data.page, 1);
  const pageSize = getNumber(data.pageSize || data.page_size, PAGE_SIZE);

  return { items, total, page, pageSize };
}

function normalizeCommissionPayload(payload: unknown): ArnCommissionResponse {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const kpis = normalizeKpisPayload(data.kpis || data.summary || data);
  const trend = normalizeTrendPayload(data.trend || data.trendPoints || payload);
  const amcSplit = normalizeAmcSplitPayload(data.amcSplit || data.amc_split || payload);
  const ledger = normalizeLedgerPayload(data.ledger || data.ledgerItems || data.results || payload);

  return {
    ...kpis,
    trend,
    amcSplit,
    ledger: ledger.items,
    total: ledger.total,
    page: ledger.page,
    pageSize: ledger.pageSize,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLatency<T>(value: T): Promise<T> {
  await delay(450);
  return value;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

function isApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ARN_COMMISSION_API_ENABLED === "true";
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === "string" ? payload.message : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

function buildCommissionUrl(params: ArnCommissionListParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.month) searchParams.set("month", params.month);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  if (params.sortKey) searchParams.set("sortKey", params.sortKey);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

async function getArnCommissionKpisFromApi(signal?: AbortSignal): Promise<ArnCommissionKpis> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnCommissionEndpoints.COMMISSION_KPIS}`, { signal });
  return normalizeKpisPayload(payload);
}

async function getArnCommissionTrendFromApi(signal?: AbortSignal): Promise<ArnCommissionTrendPoint[]> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnCommissionEndpoints.COMMISSION_TREND}`, { signal });
  return normalizeTrendPayload(payload);
}

async function getArnCommissionAmcSplitFromApi(signal?: AbortSignal): Promise<ArnAmcSplit[]> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnCommissionEndpoints.COMMISSION_AMC_SPLIT}`, { signal });
  return normalizeAmcSplitPayload(payload);
}

async function getArnCommissionFromApi(params: ArnCommissionListParams, signal?: AbortSignal): Promise<ArnCommissionResponse> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnCommissionEndpoints.COMMISSION_LEDGER}?${buildCommissionUrl(params)}`, { signal });
  return normalizeCommissionPayload(payload);
}

export async function getArnCommissionKpis(signal?: AbortSignal): Promise<ArnCommissionKpis> {
  if (process.env.NEXT_PUBLIC_ARN_COMMISSION_FORCE_ERROR === "true") {
    throw new Error("Commission service is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyKpis());
  }

  return getArnCommissionKpisFromApi(signal);
}

export async function getArnCommissionTrend(signal?: AbortSignal): Promise<ArnCommissionTrendPoint[]> {
  if (process.env.NEXT_PUBLIC_ARN_COMMISSION_FORCE_ERROR === "true") {
    throw new Error("Commission trend is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyTrend());
  }

  return getArnCommissionTrendFromApi(signal);
}

export async function getArnCommissionAmcSplit(signal?: AbortSignal): Promise<ArnAmcSplit[]> {
  if (process.env.NEXT_PUBLIC_ARN_COMMISSION_FORCE_ERROR === "true") {
    throw new Error("AMC split is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyAmcSplit());
  }

  return getArnCommissionAmcSplitFromApi(signal);
}

export async function getArnCommission(params: ArnCommissionListParams, signal?: AbortSignal): Promise<ArnCommissionResponse> {
  if (process.env.NEXT_PUBLIC_ARN_COMMISSION_FORCE_ERROR === "true") {
    throw new Error("Commission ledger is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyCommissionResponse(params));
  }

  return getArnCommissionFromApi(params, signal);
}

export type { ArnCommissionStatus };
