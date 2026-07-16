import { ArnOrderEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
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
  ArnOrdersSummary,
  ArnOrdersBackendOrderTypeSplit,
  ArnOrdersBackendResponse,
  ArnOrdersFetchParams,
  ArnOrdersFetchResult,
} from "@/types/arnOrders";
import type { ArnTone } from "@/types/arnClient";

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


function formatOrderDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  return "pending";
}

function normalizeKpis(summary: ArnOrdersSummary): ArnOrdersKpis {
  return {
    ordersToday: getNumber(summary.ordersToday, 0),
    successfulToday: getNumber(summary.successfulToday, 0),
    processedJune: getNumber(summary.processedThisMonth, 0),
    transactedJuneInPaise: getNumber(summary.transactedAmountThisMonth, 0) * 100,
    transactedAmountThisMonth: getNumber(summary.transactedAmountThisMonth, 0) * 100,
    failedOrders: getNumber(summary.failedOrders, 0),
    pendingOrders: getNumber(summary.pendingOrders, 0),
  };
}

function normalizeActivity(value: unknown, index: number): ArnOrderActivity {
  const source = isRecord(value) ? value : {};
  const status = normalizeOrderStatus(source.status || source.orderStatus);
  return {
    id: getString(source.orderId || source.id || source.activityId || source._id, `activity-${index}`),
    title: getString(source.title || source.label || source.description, "Order activity"),
    description: getString(source.description || source.detail || source.subtitle, "Order update received"),
    timestamp: getString(source.timestamp || source.createdAt || source.date, ""),
    timestampLabel: getString(source.timestampLabel || source.timestamp_label || source.timeLabel, "—"),
    status,
    statusLabel: getString(source.statusLabel || source.status_label || source.statusText, statusLabels[status]),
  };
}

function normalizeTypeSplit(split: ArnOrdersBackendOrderTypeSplit): ArnOrderTypeSplit[] {
  return [
    { type: "sip", label: "SIP", percentage: getNumber(split.sipPercent, 0), valueInPaise: 0, tone: "amber" },
    { type: "lumpsum", label: "Lumpsum", percentage: getNumber(split.lumpsumPercent, 0), valueInPaise: 0, tone: "blue" },
    { type: "redemption", label: "Redemption", percentage: getNumber(split.redemptionPercent, 0), valueInPaise: 0, tone: "green" },
    { type: "switch", label: "Switch", percentage: getNumber(split.switchPercent, 0), valueInPaise: 0, tone: "purple" },
  ];
}

function normalizeOrder(value: unknown, index: number): ArnOrderItem {
  const source = isRecord(value) ? value : {};
  const type = normalizeOrderType(source.type || source.orderType || source.transactionType);
  const status = normalizeOrderStatus(source.status || source.orderStatus);
  const amountInPaise = getNumber(source.amountInPaise || source.amount, 0);
  const clientName = getString(source.clientName || source.name || source.fullName, `Client ${index + 1}`);
  const clientShortName = getString(source.clientShortName || source.shortName, `${clientName.split(" ")[0]} ${clientName.split(" ")[1]?.[0] || ""}.`);

  const rawDate = getString(source.createdAt || source.date || source.transactionDate, "");

  return {
    id: getString(source.id || source.orderId || source._id, `order-${index + 1}`),
    date: rawDate,
    dateLabel: formatOrderDate(rawDate),
    clientName,
    clientShortName,
    clientId:
      source.userId !== undefined && source.userId !== null
        ? String(source.userId)
        : getString(source.clientId ?? source.client_id, `client-${index + 1}`),
    initials: getString(source.initials, getInitials(clientName)),
    tone: toneOrder[index % toneOrder.length],
    fundName: getString(source.fundName || source.scheme || source.fund, "Fund"),
    type,
    typeLabel: getString(source.typeLabel || source.type_label || typeLabels[type]),
    amount: getString(source.amountText || source.amount, `₹${amountInPaise.toLocaleString("en-IN")}`),
    amountInPaise,
    units: getString(source.unitsText || source.units || source.unitLabel, "—"),
    unitsValue: source.unitsValue || source.units ? getNumber(source.unitsValue || source.units, 0) : undefined,
    status,
    statusLabel: getString(source.statusLabel || source.status_label || source.statusText, statusLabels[status]),
    actionLabel: getString(source.actionLabel || source.action_label || ({ done: "Details", pending: "Track", processing: "View", failed: "Retry" }[status])),
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

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === "string" ? payload.message : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

// function sortOrders<T extends ArnOrderItem>(items: T[], sortKey?: ArnOrderSortKey, sortDirection?: "asc" | "desc"): T[] {
//   if (!sortKey) return items;
//   const sorted = [...items];
//   sorted.sort((a, b) => {
//     let aValue = (a as Record<string, unknown>)[sortKey] ?? 0;
//     let bValue = (b as Record<string, unknown>)[sortKey] ?? 0;
//
//     if (sortKey === "amount") {
//       aValue = a.amountInPaise;
//       bValue = b.amountInPaise;
//     }
//     if (sortKey === "units") {
//       aValue = a.unitsValue ?? -1;
//       bValue = b.unitsValue ?? -1;
//     }
//     if (sortKey === "date") {
//       aValue = Date.parse(a.date);
//       bValue = Date.parse(b.date);
//     }
//
//     if (typeof aValue === "number" && typeof bValue === "number") {
//       return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
//     }
//
//     return sortDirection === "asc"
//       ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
//       : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
//   });
//   return sorted;
// }

export async function fetchOrders(params: ArnOrdersFetchParams): Promise<ArnOrdersFetchResult> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(Math.min(50, params.pageSize || 5)));
  if (params.type) {
    searchParams.set("type", params.type);
  } else {
    searchParams.set("type", "individual");
  }
  if (params.filter) {
    searchParams.set("filter", params.filter);
  } else {
    searchParams.set("filter", "all");
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const payload = await fetchJson<ArnOrdersBackendResponse>(
    `${getApiUrl()}${ArnOrderEndpoints.ORDERS}?${searchParams.toString()}`
  );

  const kpis = normalizeKpis(payload.summary);
  const activities = payload.todayActivity.map((activity, index) => normalizeActivity(activity, index));
  const typeSplit = normalizeTypeSplit(payload.orderTypeSplit);
  let orders = payload.orders.map((order, index) => normalizeOrder(order, index));

  if (params.status && params.status !== "all") {
    orders = orders.filter((order) => order.status === params.status);
  }

  // orders = sortOrders(orders, params.sortKey, params.sortDirection);

  return {
    kpis,
    activities,
    typeSplit,
    orders,
    total: payload.pagination?.totalItems ?? orders.length,
    page: payload.pagination.currentPage,
    pageSize: payload.pagination.itemsPerPage,
    pagination: payload.pagination,
  };
}

export async function getArnOrders(params: ArnOrdersListParams): Promise<ArnOrdersResponse> {
  const result = await fetchOrders({
    search: params.search,
    filter: params.filter,
    status: params.status,
    page: params.page,
    pageSize: params.pageSize || 5,
    type: "individual",
    sortKey: params.sortKey,
    sortDirection: params.sortDirection,
  });

  return {
    ...result.kpis,
    activities: result.activities,
    typeSplit: result.typeSplit,
    orders: result.orders,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export type { ArnOrderFilter, ArnOrderStatus, ArnOrderType, ArnOrderTypeSplit };
