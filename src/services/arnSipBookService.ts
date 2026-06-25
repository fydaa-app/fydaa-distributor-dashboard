import { ArnSipBookEndpoints } from "@/config/api-endpoints";
import type { ArnPaginatedResponse } from "@/types/arnClient";
import type {
  ArnSipBookFilter,
  ArnSipBookHealthMetric,
  ArnSipBookItem,
  ArnSipBookKpis,
  ArnSipBookListParams,
  ArnSipBookSortKey,
  ArnSipBookStatus,
  ArnSipBookTrendParams,
  ArnSipBookTrendPoint,
} from "@/types/arnSipBook";

type JsonObject = Record<string, unknown>;

const PAGE_SIZE = 5;
const TOTAL_SIPS = 62;

const toneOrder: ArnSipBookItem["tone"][] = ["amber", "blue", "green", "teal", "purple", "red"];

const sampleSips: ArnSipBookItem[] = [
  {
    id: "sip-rahul-mirae",
    clientId: "rahul-sharma",
    clientName: "Rahul Sharma",
    initials: "RS",
    tone: "amber",
    fundName: "Mirae Asset Large Cap",
    amount: "₹8,000",
    amountInPaise: 8000,
    sipDay: "10th",
    sipDayLabel: "10th",
    nextSipDate: "10 Jul",
    nextSipLabel: "10 Jul",
    xirr: 16.2,
    status: "active",
    statusLabel: "Active",
  },
  {
    id: "sip-priya-icici",
    clientId: "priya-gupta",
    clientName: "Priya Gupta",
    initials: "PG",
    tone: "blue",
    fundName: "ICICI Pru Bluechip",
    amount: "₹15,000",
    amountInPaise: 15000,
    sipDay: "5th",
    sipDayLabel: "5th",
    nextSipDate: "Today",
    nextSipLabel: "Today",
    xirr: 12.4,
    status: "due-today",
    statusLabel: "Due today",
  },
  {
    id: "sip-amit-mirae",
    clientId: "amit-kumar",
    clientName: "Amit Kumar",
    initials: "AK",
    tone: "green",
    fundName: "Mirae Asset Large Cap",
    amount: "₹10,000",
    amountInPaise: 10000,
    sipDay: "15th",
    sipDayLabel: "15th",
    nextSipDate: "15 Jul",
    nextSipLabel: "15 Jul",
    xirr: 16.2,
    status: "active",
    statusLabel: "Active",
  },
  {
    id: "sip-sunita-hdfc-short",
    clientId: "sunita-mehta",
    clientName: "Sunita Mehta",
    initials: "SM",
    tone: "teal",
    fundName: "HDFC Short Duration",
    amount: "₹5,000",
    amountInPaise: 5000,
    sipDay: "20th",
    sipDayLabel: "20th",
    nextSipDate: "—",
    nextSipLabel: "—",
    xirr: 7.1,
    status: "paused",
    statusLabel: "Paused",
  },
  {
    id: "sip-nikhil-hdfc-balanced",
    clientId: "nikhil-joshi",
    clientName: "Nikhil Joshi",
    initials: "NJ",
    tone: "red",
    fundName: "HDFC Balanced Adv",
    amount: "₹12,000",
    amountInPaise: 12000,
    sipDay: "1st",
    sipDayLabel: "1st",
    nextSipDate: "NACH fail",
    nextSipLabel: "NACH fail",
    xirr: 13.1,
    status: "at-risk",
    statusLabel: "At risk",
  },
];

const dummyKpis: ArnSipBookKpis = {
  totalSipBook: "₹3.8 L/mo",
  totalSipBookInPaise: 380000,
  activeSips: 62,
  atRiskSips: 3,
  pausedSips: 5,
  clientsWithSips: 38,
};

const dummyTrend6M: ArnSipBookTrendPoint[] = [
  { month: "Jan", value: "₹2.8 L", valueInPaise: 280000 },
  { month: "Feb", value: "₹3.1 L", valueInPaise: 310000 },
  { month: "Mar", value: "₹3.3 L", valueInPaise: 330000 },
  { month: "Apr", value: "₹3.5 L", valueInPaise: 350000 },
  { month: "May", value: "₹3.6 L", valueInPaise: 360000 },
  { month: "Jun", value: "₹3.8 L", valueInPaise: 380000 },
];

const dummyTrend1Y: ArnSipBookTrendPoint[] = [
  { month: "Jul", value: "₹2.4 L", valueInPaise: 240000 },
  { month: "Aug", value: "₹2.6 L", valueInPaise: 260000 },
  { month: "Sep", value: "₹2.7 L", valueInPaise: 270000 },
  { month: "Oct", value: "₹2.9 L", valueInPaise: 290000 },
  { month: "Nov", value: "₹3.1 L", valueInPaise: 310000 },
  { month: "Dec", value: "₹3.2 L", valueInPaise: 320000 },
  { month: "Jan", value: "₹3.3 L", valueInPaise: 330000 },
  { month: "Feb", value: "₹3.4 L", valueInPaise: 340000 },
  { month: "Mar", value: "₹3.5 L", valueInPaise: 350000 },
  { month: "Apr", value: "₹3.6 L", valueInPaise: 360000 },
  { month: "May", value: "₹3.7 L", valueInPaise: 370000 },
  { month: "Jun", value: "₹3.8 L", valueInPaise: 380000 },
];

const dummyHealth: ArnSipBookHealthMetric[] = [
  {
    label: "Success rate",
    value: "94.2%",
    caption: "May 2026",
    progress: 94,
    tone: "green",
  },
  {
    label: "NACH coverage",
    value: "89%",
    caption: "55 of 62 SIPs",
    progress: 89,
    tone: "amber",
  },
  {
    label: "Step-up SIPs",
    value: "14",
    caption: "avg +10% / yr",
    tone: "blue",
  },
  {
    label: "Avg SIP age",
    value: "18 mo",
    caption: "longest: 42 mo",
    tone: "teal",
  },
];

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getTone(index: number): ArnSipBookItem["tone"] {
  return toneOrder[index % toneOrder.length];
}

function getStatus(index: number): ArnSipBookStatus {
  if (index % 21 === 0) return "at-risk";
  if (index % 17 === 0) return "due-today";
  if (index % 13 === 0) return "paused";
  return "active";
}

function getStatusLabel(status: ArnSipBookStatus): string {
  if (status === "paused") return "Paused";
  if (status === "at-risk") return "At risk";
  if (status === "due-today") return "Due today";
  return "Active";
}

function createGeneratedSip(index: number): ArnSipBookItem {
  const clients = [
    "Rahul Sharma",
    "Priya Gupta",
    "Amit Kumar",
    "Sunita Mehta",
    "Nikhil Joshi",
    "Ananya Rao",
    "Vikram Singh",
    "Meera Nair",
    "Arjun Verma",
    "Neha Kapoor",
  ];
  const funds = [
    "Mirae Asset Large Cap",
    "ICICI Pru Bluechip",
    "HDFC Balanced Adv",
    "Parag Parikh Flexi Cap",
    "Axis Small Cap Fund",
    "HDFC Short Duration",
    "Kotak Emerging Equity",
    "SBI Magnum Gilt",
  ];
  const clientName = clients[index % clients.length];
  const suffix = Math.floor(index / clients.length) + 1;
  const fullName = suffix > 1 ? `${clientName} ${suffix}` : clientName;
  const fundName = funds[index % funds.length];
  const sipDayNumber = [1, 5, 10, 15, 20, 25][index % 6];
  const amountInPaise = 5000 + (index % 6) * 5000;
  const status = getStatus(index);

  return {
    id: `sip-${index + 1}`,
    clientId: `client-${index + 1}`,
    clientName: fullName,
    initials: getInitials(fullName),
    tone: getTone(index),
    fundName,
    amount: `₹${amountInPaise.toLocaleString("en-IN")}`,
    amountInPaise,
    sipDay: `${sipDayNumber}${getOrdinalSuffix(sipDayNumber)}`,
    sipDayLabel: `${sipDayNumber}${getOrdinalSuffix(sipDayNumber)}`,
    nextSipDate: `${sipDayNumber} Jul`,
    nextSipLabel: `${sipDayNumber} Jul`,
    xirr: Number((8.8 + (index % 9) * 0.8).toFixed(1)),
    status,
    statusLabel: getStatusLabel(status),
  };
}

function getOrdinalSuffix(value: number): string {
  if (value === 1 || value === 21 || value === 31) return "st";
  if (value === 2 || value === 22) return "nd";
  if (value === 3 || value === 23) return "rd";
  return "th";
}

const dummySips: ArnSipBookItem[] = Array.from({ length: TOTAL_SIPS }, (_, index) => {
  const sample = sampleSips[index];
  return sample || createGeneratedSip(index);
});

function getDummyKpis(): ArnSipBookKpis {
  return dummyKpis;
}

function getDummyTrend(range: "6M" | "1Y"): ArnSipBookTrendPoint[] {
  return range === "1Y" ? dummyTrend1Y : dummyTrend6M;
}

function getDummyHealth(): ArnSipBookHealthMetric[] {
  return dummyHealth;
}

function getDummySips(params: ArnSipBookListParams): ArnPaginatedResponse<ArnSipBookItem> {
  const search = (params.search || "").trim().toLowerCase();
  const status = params.status || "all";
  let items = [...dummySips];

  if (search) {
    items = items.filter((sip) => {
      const searchable = `${sip.clientName} ${sip.fundName} ${sip.statusLabel}`.toLowerCase();
      return searchable.includes(search);
    });
  }

  if (status !== "all") {
    items = items.filter((sip) => sip.status === status);
  }

  const sortKey = params.sortKey || "nextSipDate";
  const sortDirection = params.sortDirection || "asc";

  items.sort((a, b) => {
    const aValue = a[sortKey as ArnSipBookSortKey];
    const bValue = b[sortKey as ArnSipBookSortKey];

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
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total,
    page,
    pageSize,
  };
}

function normalizeTone(value: unknown, fallback: ArnSipBookItem["tone"] = "amber"): ArnSipBookItem["tone"] {
  const tone = getString(value);
  return ["amber", "green", "blue", "red", "purple", "teal"].includes(tone)
    ? (tone as ArnSipBookItem["tone"])
    : fallback;
}

function normalizeStatus(value: unknown): ArnSipBookStatus {
  const status = getString(value).toLowerCase();
  if (status === "paused") return "paused";
  if (status === "at-risk" || status === "risk" || status === "at risk") return "at-risk";
  if (status === "due-today" || status === "due today") return "due-today";
  return "active";
}

function normalizeKpisPayload(payload: unknown): ArnSipBookKpis {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const totalSipBookInPaise = getNumber(
    data.totalSipBookInPaise || data.total_sip_book_in_paise || data.totalSipBook || data.total_sip_book,
    0
  );

  return {
    totalSipBook: getString(
      data.totalSipBookText || data.total_sip_book_text || data.totalSipBook,
      `₹${Math.round(totalSipBookInPaise / 100000)} L/mo`
    ),
    totalSipBookInPaise,
    activeSips: getNumber(data.activeSips || data.active_sips, 0),
    atRiskSips: getNumber(data.atRiskSips || data.at_risk_sips || data.riskSips, 0),
    pausedSips: getNumber(data.pausedSips || data.paused_sips, 0),
    clientsWithSips: getNumber(data.clientsWithSips || data.clients_with_sips, 0),
  };
}

function normalizeTrendPayload(payload: unknown): ArnSipBookTrendPoint[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.points || data.items || data.trend, (item) => {
    const source = isRecord(item) ? item : {};
    const valueInPaise = getNumber(source.valueInPaise || source.value, 0);

    return {
      month: getString(source.month || source.label, "—"),
      value: getString(source.valueText || source.value, `₹${Math.round(valueInPaise / 100000)} L`),
      valueInPaise,
    };
  });
}

function normalizeHealthPayload(payload: unknown): ArnSipBookHealthMetric[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.metrics || data.items || data.health, (item) => {
    const source = isRecord(item) ? item : {};
    const progress = getNumber(source.progress, 0);
    const tone = normalizeTone(source.tone || source.color);

    return {
      label: getString(source.label || source.name, "Metric"),
      value: getString(source.valueText || source.value, "—"),
      caption: getString(source.caption || source.description, ""),
      progress: progress > 0 ? progress : undefined,
      tone,
    };
  });
}

function normalizeSipBookItem(source: JsonObject, fallbackIndex: number): ArnSipBookItem {
  const status = normalizeStatus(source.status || source.sipStatus);
  const amountInPaise = getNumber(source.amountInPaise || source.amount, 0);
  const clientName = getString(source.clientName || source.name || source.fullName, `Client ${fallbackIndex + 1}`);

  return {
    id: getString(source.id || source.sipId || source._id, `sip-${fallbackIndex + 1}`),
    clientId: getString(source.clientId || source.client_id, `client-${fallbackIndex + 1}`),
    clientName,
    initials: getString(source.initials, getInitials(clientName)),
    tone: normalizeTone(source.tone || source.color, getTone(fallbackIndex)),
    fundName: getString(source.fundName || source.fund, "Fund"),
    amount: getString(source.amountText || source.amount, `₹${amountInPaise.toLocaleString("en-IN")}`),
    amountInPaise,
    sipDay: getString(source.sipDay || source.sip_day || source.day, "—"),
    sipDayLabel: getString(source.sipDayLabel || source.sip_day_label || source.sipDay, "—"),
    nextSipDate: getString(source.nextSipDate || source.next_sip_date, "—"),
    nextSipLabel: getString(source.nextSipLabel || source.next_sip_label || source.nextSipDate, "—"),
    xirr: getNumber(source.xirr, 0),
    status,
    statusLabel: getString(source.statusLabel || source.status_label || source.statusText, getStatusLabel(status)),
  };
}

function normalizeSipBookPayload(payload: unknown): ArnPaginatedResponse<ArnSipBookItem> {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const items = getArray(data.sips || data.items || data.results, (item) =>
    normalizeSipBookItem(isRecord(item) ? item : {}, 0)
  );
  const total = getNumber(data.total, items.length);
  const page = getNumber(data.page, 1);
  const pageSize = getNumber(data.pageSize || data.page_size, PAGE_SIZE);

  return {
    items,
    total,
    page,
    pageSize,
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
  return process.env.NEXT_PUBLIC_ARN_SIPBOOK_API_ENABLED === "true";
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

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

async function getArnSipBookKpisFromApi(signal?: AbortSignal): Promise<ArnSipBookKpis> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnSipBookEndpoints.SIP_KPIS}`, { signal });
  return normalizeKpisPayload(payload);
}

async function getArnSipBookTrendFromApi(params: ArnSipBookTrendParams, signal?: AbortSignal): Promise<ArnSipBookTrendPoint[]> {
  const searchParams = new URLSearchParams();
  if (params.range) searchParams.set("range", params.range);

  const payload = await fetchJson<unknown>(
    `${getApiUrl()}${ArnSipBookEndpoints.SIP_TREND}?${searchParams.toString()}`,
    { signal }
  );

  return normalizeTrendPayload(payload);
}

async function getArnSipBookHealthFromApi(signal?: AbortSignal): Promise<ArnSipBookHealthMetric[]> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnSipBookEndpoints.SIP_HEALTH}`, { signal });
  return normalizeHealthPayload(payload);
}

async function getArnSipBookFromApi(params: ArnSipBookListParams, signal?: AbortSignal): Promise<ArnPaginatedResponse<ArnSipBookItem>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  if (params.sortKey) searchParams.set("sortKey", params.sortKey);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  const payload = await fetchJson<unknown>(
    `${getApiUrl()}${ArnSipBookEndpoints.SIP_BOOK}?${searchParams.toString()}`,
    { signal }
  );

  return normalizeSipBookPayload(payload);
}

export async function getArnSipBookKpis(signal?: AbortSignal): Promise<ArnSipBookKpis> {
  if (!isApiEnabled()) {
    return withLatency(getDummyKpis());
  }

  return getArnSipBookKpisFromApi(signal);
}

export async function getArnSipBookTrend(
  params: ArnSipBookTrendParams = {},
  signal?: AbortSignal
): Promise<ArnSipBookTrendPoint[]> {
  if (!isApiEnabled()) {
    return withLatency(getDummyTrend(params.range || "6M"));
  }

  return getArnSipBookTrendFromApi(params, signal);
}

export async function getArnSipBookHealth(signal?: AbortSignal): Promise<ArnSipBookHealthMetric[]> {
  if (!isApiEnabled()) {
    return withLatency(getDummyHealth());
  }

  return getArnSipBookHealthFromApi(signal);
}

export async function getArnSipBook(
  params: ArnSipBookListParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnSipBookItem>> {
  if (!isApiEnabled()) {
    return withLatency(getDummySips(params));
  }

  return getArnSipBookFromApi(params, signal);
}

export type { ArnSipBookFilter, ArnSipBookSortKey, ArnSipBookStatus };
