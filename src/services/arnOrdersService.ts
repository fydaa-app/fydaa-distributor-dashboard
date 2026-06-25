import { ArnOrderEndpoints } from "@/config/api-endpoints";
import type { ArnPaginatedResponse } from "@/types/arnClient";
import type {
  ArnOrderActivity,
  ArnOrderFilter,
  ArnOrderItem,
  ArnOrderStatus,
  ArnOrderType,
  ArnOrderTypeSplit,
  ArnOrdersKpis,
  ArnOrdersListParams,
  ArnOrdersResponse,
} from "@/types/arnOrders";
import type { ArnTone } from "@/types/arnClient";

type JsonObject = Record<string, unknown>;

const PAGE_SIZE = 5;
const TOTAL_ORDERS = 147;
//const toneOrder: ArnTone[] = ["amber", "blue", "green", "teal", "red", "purple"];

const typeLabels: Record<ArnOrderType, string> = {
  sip: "SIP",
  lumpsum: "Lumpsum",
  redemption: "Redemption",
  switch: "Switch",
};

const statusLabels: Record<ArnOrderStatus, string> = {
  done: "Done",
  pending: "Pending",
  failed: "Failed",
  processing: "Processing",
};

const clients = [
  { clientId: "rahul-sharma", clientName: "Rahul Sharma", initials: "RS", tone: "amber" as ArnTone },
  { clientId: "priya-gupta", clientName: "Priya Gupta", initials: "PG", tone: "blue" as ArnTone },
  { clientId: "amit-kumar", clientName: "Amit Kumar", initials: "AK", tone: "green" as ArnTone },
  { clientId: "nikhil-joshi", clientName: "Nikhil Joshi", initials: "NJ", tone: "red" as ArnTone },
  { clientId: "sunita-mehta", clientName: "Sunita Mehta", initials: "SM", tone: "teal" as ArnTone },
  { clientId: "ananya-rao", clientName: "Ananya Rao", initials: "AR", tone: "purple" as ArnTone },
  { clientId: "vikram-singh", clientName: "Vikram Singh", initials: "VS", tone: "amber" as ArnTone },
  { clientId: "meera-nair", clientName: "Meera Nair", initials: "MN", tone: "green" as ArnTone },
  { clientId: "arjun-verma", clientName: "Arjun Verma", initials: "AV", tone: "blue" as ArnTone },
  { clientId: "neha-kapoor", clientName: "Neha Kapoor", initials: "NK", tone: "teal" as ArnTone },
];

const funds = [
  "Mirae Asset Large Cap",
  "ICICI Pru Bluechip",
  "HDFC Short Duration",
  "Parag Parikh Flexi Cap",
  "Axis Small Cap Fund",
  "HDFC Balanced Adv",
  "Kotak Emerging Equity",
  "SBI Magnum Gilt",
];

// function getOrdinalSuffix(value: number): string {
//   if (value === 1 || value === 21 || value === 31) return "st";
//   if (value === 2 || value === 22) return "nd";
//   if (value === 3 || value === 23) return "rd";
//   return "th";
// }

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatPaise(value: number): string {
  return `₹${Math.abs(value).toLocaleString("en-IN")}`;
}

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

function normalizeTone(value: unknown, fallback: ArnTone = "amber"): ArnTone {
  const tone = getString(value).toLowerCase();
  return ["amber", "green", "blue", "red", "purple", "teal"].includes(tone) ? (tone as ArnTone) : fallback;
}

function normalizeOrderType(value: unknown): ArnOrderType {
  const type = getString(value).toLowerCase();
  if (type === "sip") return "sip";
  if (type === "lumpsum" || type === "lump sum" || type === "purchase") return "lumpsum";
  if (type === "redemption" || type === "redeem") return "redemption";
  if (type === "switch") return "switch";
  return "sip";
}

function normalizeOrderStatus(value: unknown): ArnOrderStatus {
  const status = getString(value).toLowerCase();
  if (status === "done" || status === "success" || status === "successful" || status === "processed") return "done";
  if (status === "processing" || status === "in-progress" || status === "in progress") return "processing";
  if (status === "pending" || status === "awaiting" || status === "waiting") return "pending";
  if (status === "failed" || status === "fail" || status === "error") return "failed";
  return "processing";
}

function getStatus(index: number): ArnOrderStatus {
  if (index % 23 === 0) return "failed";
  if (index % 17 === 0) return "pending";
  if (index % 13 === 0) return "processing";
  return "done";
}

function getType(index: number): ArnOrderType {
  if (index % 10 < 6) return "sip";
  if (index % 10 < 8) return "lumpsum";
  if (index % 10 === 8) return "redemption";
  return "switch";
}

function getActionLabel(status: ArnOrderStatus): string {
  if (status === "failed") return "Retry";
  if (status === "pending") return "Track";
  if (status === "processing") return "View";
  return "Details";
}

function createOrder(index: number): ArnOrderItem {
  const client = clients[index % clients.length];
  const fundName = funds[index % funds.length];
  const type = getType(index);
  const status = getStatus(index);
  const dayOffset = index % 30;
  const hour = 9 + (index * 3) % 8;
  const minute = [15, 24, 30, 45, 52][index % 5];
  const date = new Date(2026, 5, 11 - dayOffset, hour, minute);
  const amountInPaise =
    type === "sip"
      ? 8000 + (index % 5) * 4000
      : type === "lumpsum"
        ? 50000 + (index % 8) * 12500
        : type === "redemption"
          ? 30000 + (index % 7) * 10000
          : 25000 + (index % 6) * 15000;
  const unitsValue =
  status === "failed" || type === "redemption"
    ? undefined
    : Number(
        (
          amountInPaise /
          Number((18.7 + (index % 9)).toFixed(2))
        ).toFixed(1)
      );

  return {
    id: `order-${index + 1}`,
    date: date.toISOString(),
    dateLabel: `${pad(date.getDate())} Jun ${pad(hour)}:${pad(minute)}`,
    clientName: client.clientName,
    clientShortName: `${client.clientName.split(" ")[0]} ${client.clientName.split(" ")[1]?.[0]}.` || client.clientName,
    clientId: client.clientId,
    initials: client.initials,
    tone: client.tone,
    fundName,
    type,
    typeLabel: typeLabels[type],
    amount: formatPaise(amountInPaise),
    amountInPaise,
    units: unitsValue === undefined ? "—" : unitsValue.toLocaleString("en-IN", { maximumFractionDigits: 1 }),
    unitsValue,
    status,
    statusLabel: statusLabels[status],
    actionLabel: getActionLabel(status),
  };
}

const sampleOrders: ArnOrderItem[] = [
  {
    id: "order-rahul-sip-1024",
    date: "2026-06-11T10:24:00.000Z",
    dateLabel: "11 Jun 10:24",
    clientName: "Rahul Sharma",
    clientShortName: "Rahul S.",
    clientId: "rahul-sharma",
    initials: "RS",
    tone: "amber",
    fundName: "Mirae Asset Large Cap",
    type: "sip",
    typeLabel: "SIP",
    amount: "₹8,000",
    amountInPaise: 8000,
    units: "42.3",
    unitsValue: 42.3,
    status: "done",
    statusLabel: "Done",
    actionLabel: "Details",
  },
  {
    id: "order-sunita-lumpsum-0915",
    date: "2026-06-11T09:15:00.000Z",
    dateLabel: "11 Jun 09:15",
    clientName: "Sunita Mehta",
    clientShortName: "Sunita M.",
    clientId: "sunita-mehta",
    initials: "SM",
    tone: "teal",
    fundName: "HDFC Short Duration",
    type: "lumpsum",
    typeLabel: "Lumpsum",
    amount: "₹50,000",
    amountInPaise: 50000,
    units: "1,621",
    unitsValue: 1621,
    status: "done",
    statusLabel: "Done",
    actionLabel: "Details",
  },
  {
    id: "order-amit-sip-1402",
    date: "2026-06-10T14:02:00.000Z",
    dateLabel: "10 Jun 14:02",
    clientName: "Amit Kumar",
    clientShortName: "Amit K.",
    clientId: "amit-kumar",
    initials: "AK",
    tone: "green",
    fundName: "Mirae Asset Large Cap",
    type: "sip",
    typeLabel: "SIP",
    amount: "₹10,000",
    amountInPaise: 10000,
    units: "52.8",
    unitsValue: 52.8,
    status: "done",
    statusLabel: "Done",
    actionLabel: "Details",
  },
  {
    id: "order-nikhil-sip-1130",
    date: "2026-06-10T11:30:00.000Z",
    dateLabel: "10 Jun 11:30",
    clientName: "Nikhil Joshi",
    clientShortName: "Nikhil J.",
    clientId: "nikhil-joshi",
    initials: "NJ",
    tone: "red",
    fundName: "HDFC Balanced Adv",
    type: "sip",
    typeLabel: "SIP",
    amount: "₹12,000",
    amountInPaise: 12000,
    units: "—",
    status: "failed",
    statusLabel: "Failed",
    actionLabel: "Retry",
  },
  {
    id: "order-priya-switch-1645",
    date: "2026-06-09T16:45:00.000Z",
    dateLabel: "09 Jun 16:45",
    clientName: "Priya Gupta",
    clientShortName: "Priya G.",
    clientId: "priya-gupta",
    initials: "PG",
    tone: "blue",
    fundName: "Axis Small Cap Fund",
    type: "switch",
    typeLabel: "Switch",
    amount: "₹25,000",
    amountInPaise: 25000,
    units: "89.2",
    unitsValue: 89.2,
    status: "done",
    statusLabel: "Done",
    actionLabel: "Details",
  },
];

const dummyOrders: ArnOrderItem[] = Array.from({ length: TOTAL_ORDERS }, (_, index) => sampleOrders[index] || createOrder(index));

const dummyKpis: ArnOrdersKpis = {
  ordersToday: 8,
  successfulToday: 6,
  processedJune: 147,
  transactedJuneInPaise: 2840000,
  failedOrders: 4,
  pendingOrders: 3,
};

const dummyActivities: ArnOrderActivity[] = [
  {
    id: "activity-rahul-sip",
    title: "SIP processed — Rahul Sharma",
    description: "Mirae Asset Large Cap · ₹8,000 · 10:24 AM",
    amountInPaise: 8000,
    timestamp: "2026-06-11T10:24:00.000Z",
    timestampLabel: "10:24 AM",
    status: "done",
    statusLabel: "Success",
  },
  {
    id: "activity-sunita-lumpsum",
    title: "Lumpsum — Sunita Mehta",
    description: "HDFC Short Duration · ₹50,000 · 09:15 AM",
    amountInPaise: 50000,
    timestamp: "2026-06-11T09:15:00.000Z",
    timestampLabel: "09:15 AM",
    status: "done",
    statusLabel: "Success",
  },
  {
    id: "activity-priya-sip",
    title: "SIP pending — Priya Gupta",
    description: "ICICI Pru Bluechip · ₹15,000 · awaiting NACH",
    amountInPaise: 15000,
    timestamp: "2026-06-11T08:50:00.000Z",
    timestampLabel: "08:50 AM",
    status: "pending",
    statusLabel: "Pending",
  },
  {
    id: "activity-nikhil-nach",
    title: "NACH failure — Nikhil Joshi",
    description: "HDFC Balanced Adv · ₹12,000 · insufficient funds",
    amountInPaise: 12000,
    timestamp: "2026-06-10T11:30:00.000Z",
    timestampLabel: "Yesterday",
    status: "failed",
    statusLabel: "Failed",
  },
];

const dummyTypeSplit: ArnOrderTypeSplit[] = [
  { type: "sip", label: "SIP", percentage: 58, valueInPaise: 1647200, tone: "amber" },
  { type: "lumpsum", label: "Lumpsum", percentage: 26, valueInPaise: 738400, tone: "blue" },
  { type: "redemption", label: "Redemption", percentage: 10, valueInPaise: 284000, tone: "green" },
  { type: "switch", label: "Switch", percentage: 6, valueInPaise: 170400, tone: "purple" },
];

function getDummyKpis(): ArnOrdersKpis {
  return dummyKpis;
}

function getDummyActivities(): ArnOrderActivity[] {
  return dummyActivities;
}

function getDummyTypeSplit(): ArnOrderTypeSplit[] {
  return dummyTypeSplit;
}

function getDummyOrders(params: ArnOrdersListParams): ArnPaginatedResponse<ArnOrderItem> {
  const search = (params.search || "").trim().toLowerCase();
  const filter = params.filter || "all";
  const statusFilter = params.status || "all";
  let items = [...dummyOrders];

  if (search) {
    items = items.filter((order) => {
      const searchable = `${order.clientName} ${order.clientShortName} ${order.fundName} ${order.typeLabel} ${order.statusLabel} ${order.dateLabel}`.toLowerCase();
      return searchable.includes(search);
    });
  }

  if (filter !== "all") {
    items = items.filter((order) => (filter === "failed" ? order.status === "failed" : order.type === filter));
  }

  if (statusFilter !== "all") {
    items = items.filter((order) => order.status === statusFilter);
  }

  const sortKey = params.sortKey || "date";
  const sortDirection = params.sortDirection || "desc";

  items.sort((a, b) => {

    let aValue = a[sortKey as keyof ArnOrderItem] ?? 0;
    let bValue = b[sortKey as keyof ArnOrderItem] ?? 0;

    if (sortKey === "amount") {
      aValue = a.amountInPaise;
      bValue = b.amountInPaise;
    }

    if (sortKey === "units") {
      aValue = a.unitsValue ?? -1;
      bValue = b.unitsValue ?? -1;
    }

    if (sortKey === "date") {
      aValue = Date.parse(a.date);
      bValue = Date.parse(b.date);
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

function getDummyOrdersResponse(params: ArnOrdersListParams): ArnOrdersResponse {
  const paginatedOrders = getDummyOrders(params);

  return {
    ...dummyKpis,
    activities: dummyActivities,
    typeSplit: dummyTypeSplit,
    orders: paginatedOrders.items,
    total: paginatedOrders.total,
    page: paginatedOrders.page,
    pageSize: paginatedOrders.pageSize,
  };
}

function normalizeKpisPayload(payload: unknown): ArnOrdersKpis {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const transactedJuneInPaise = getNumber(data.transactedJuneInPaise || data.transacted_june_in_paise || data.transactedJune, 0);

  return {
    ordersToday: getNumber(data.ordersToday || data.orders_today || data.todayOrders, 0),
    successfulToday: getNumber(data.successfulToday || data.successful_today || data.todaySuccessful, 0),
    processedJune: getNumber(data.processedJune || data.processed_june || data.juneProcessed, 0),
    transactedJuneInPaise,
    failedOrders: getNumber(data.failedOrders || data.failed_orders || data.failed, 0),
    pendingOrders: getNumber(data.pendingOrders || data.pending_orders || data.pending, 0),
  };
}

function normalizeActivityPayload(payload: unknown): ArnOrderActivity[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.activities || data.items || data.timeline, (item) => {
    const source = isRecord(item) ? item : {};
    const status = normalizeOrderStatus(source.status || source.orderStatus);

    return {
      id: getString(source.id || source.activityId || source._id, `activity-${Math.random()}`),
      title: getString(source.title || source.label || source.description, "Order activity"),
      description: getString(source.description || source.detail || source.subtitle, ""),
      amountInPaise: getNumber(source.amountInPaise || source.amount, 0),
      timestamp: getString(source.timestamp || source.createdAt || source.date, ""),
      timestampLabel: getString(source.timestampLabel || source.timestamp_label || source.timeLabel, "—"),
      status,
      statusLabel: getString(source.statusLabel || source.status_label || source.statusText, statusLabels[status]),
    };
  });
}

function normalizeTypeSplitPayload(payload: unknown): ArnOrderTypeSplit[] {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  return getArray(data.typeSplit || data.items || data.split, (item) => {
    const source = isRecord(item) ? item : {};
    const type = normalizeOrderType(source.type || source.orderType);

    return {
      type,
      label: getString(source.label || source.name || typeLabels[type]),
      percentage: getNumber(source.percentage || source.percent, 0),
      valueInPaise: getNumber(source.valueInPaise || source.value, 0),
      tone: normalizeTone(source.tone || source.color),
    };
  });
}

function normalizeOrderPayload(source: JsonObject, fallbackIndex: number): ArnOrderItem {
  const type = normalizeOrderType(source.type || source.orderType || source.transactionType);
  const status = normalizeOrderStatus(source.status || source.orderStatus);
  const amountInPaise = getNumber(source.amountInPaise || source.amount, 0);
  const clientName = getString(source.clientName || source.name || source.fullName, `Client ${fallbackIndex + 1}`);
  const clientShortName = getString(source.clientShortName || source.shortName, `${clientName.split(" ")[0]} ${clientName.split(" ")[1]?.[0] || ""}.`);

  return {
    id: getString(source.id || source.orderId || source._id, `order-${fallbackIndex + 1}`),
    date: getString(source.date || source.createdAt || source.transactionDate, ""),
    dateLabel: getString(source.dateLabel || source.date_label || source.timeLabel, "—"),
    clientName,
    clientShortName,
    clientId: getString(source.clientId || source.client_id, `client-${fallbackIndex + 1}`),
    initials: getString(source.initials, clientName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CL"),
    tone: normalizeTone(source.tone || source.color),
    fundName: getString(source.fundName || source.scheme || source.fund, "Fund"),
    type,
    typeLabel: getString(source.typeLabel || source.type_label || typeLabels[type]),
    amount: getString(source.amountText || source.amount, `₹${amountInPaise.toLocaleString("en-IN")}`),
    amountInPaise,
    units: getString(source.unitsText || source.units || source.unitLabel, "—"),
    unitsValue: source.unitsValue || source.units ? getNumber(source.unitsValue || source.units, 0) : undefined,
    status,
    statusLabel: getString(source.statusLabel || source.status_label || source.statusText, statusLabels[status]),
    actionLabel: getString(source.actionLabel || source.action_label || getActionLabel(status)),
  };
}

function normalizeOrdersPayload(payload: unknown): ArnOrdersResponse {
  const data = isRecord(payload) ? (getNestedRecord(payload, "data") || payload) : {};
  const kpis = normalizeKpisPayload(data.kpis || data.summary || data);
  const activities = normalizeActivityPayload(data.activities || data.activity || data.timeline || payload);
  const typeSplit = normalizeTypeSplitPayload(data.typeSplit || data.type_split || data.orderTypeSplit || payload);
  const items = getArray(data.orders || data.items || data.results, (item) => normalizeOrderPayload(isRecord(item) ? item : {}, 0));
  const total = getNumber(data.total, items.length || TOTAL_ORDERS);
  const page = getNumber(data.page, 1);
  const pageSize = getNumber(data.pageSize || data.page_size, PAGE_SIZE);

  return {
    ...kpis,
    activities,
    typeSplit,
    orders: items,
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
  return process.env.NEXT_PUBLIC_ARN_ORDERS_API_ENABLED === "true";
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

function buildOrdersUrl(params: ArnOrdersListParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.filter && params.filter !== "all") searchParams.set("filter", params.filter);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  if (params.sortKey) searchParams.set("sortKey", params.sortKey);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

async function getArnOrdersKpisFromApi(signal?: AbortSignal): Promise<ArnOrdersKpis> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnOrderEndpoints.ORDERS_KPIS}`, { signal });
  return normalizeKpisPayload(payload);
}

async function getArnOrdersActivityFromApi(signal?: AbortSignal): Promise<ArnOrderActivity[]> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnOrderEndpoints.ORDERS_ACTIVITY}`, { signal });
  return normalizeActivityPayload(payload);
}

async function getArnOrdersTypeSplitFromApi(signal?: AbortSignal): Promise<ArnOrderTypeSplit[]> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnOrderEndpoints.ORDERS_TYPE_SPLIT}`, { signal });
  return normalizeTypeSplitPayload(payload);
}

async function getArnOrdersFromApi(params: ArnOrdersListParams, signal?: AbortSignal): Promise<ArnOrdersResponse> {
  const payload = await fetchJson<unknown>(`${getApiUrl()}${ArnOrderEndpoints.ORDERS}?${buildOrdersUrl(params)}`, { signal });
  return normalizeOrdersPayload(payload);
}

export async function getArnOrdersKpis(signal?: AbortSignal): Promise<ArnOrdersKpis> {
  if (process.env.NEXT_PUBLIC_ARN_ORDERS_FORCE_ERROR === "true") {
    throw new Error("Orders service is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyKpis());
  }

  return getArnOrdersKpisFromApi(signal);
}

export async function getArnOrdersActivity(signal?: AbortSignal): Promise<ArnOrderActivity[]> {
  if (process.env.NEXT_PUBLIC_ARN_ORDERS_FORCE_ERROR === "true") {
    throw new Error("Orders activity is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyActivities());
  }

  return getArnOrdersActivityFromApi(signal);
}

export async function getArnOrdersTypeSplit(signal?: AbortSignal): Promise<ArnOrderTypeSplit[]> {
  if (process.env.NEXT_PUBLIC_ARN_ORDERS_FORCE_ERROR === "true") {
    throw new Error("Order type split is temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyTypeSplit());
  }

  return getArnOrdersTypeSplitFromApi(signal);
}

export async function getArnOrders(params: ArnOrdersListParams, signal?: AbortSignal): Promise<ArnOrdersResponse> {
  if (process.env.NEXT_PUBLIC_ARN_ORDERS_FORCE_ERROR === "true") {
    throw new Error("Orders are temporarily unavailable.");
  }

  if (!isApiEnabled()) {
    return withLatency(getDummyOrdersResponse(params));
  }

  return getArnOrdersFromApi(params, signal);
}

export type { ArnOrderFilter, ArnOrderStatus, ArnOrderType, ArnOrderTypeSplit };
