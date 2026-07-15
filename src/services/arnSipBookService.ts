import { ArnSipBookEndpoints } from "@/config/api-endpoints";
import type {
  ArnSipBookBackendResponse,
  ArnSipBookBackendSip,
  ArnSipBookFilter,
  ArnSipBookHealthData,
  ArnSipBookInflowTrendPoint,
  ArnSipBookItem,
  ArnSipBookKpis,
  ArnSipBookListParams,
  ArnSipBookStatus,
  ArnSipBookSummary,
  ArnSipBookTrendPoint,
} from "@/types/arnSipBook";

import { getCookie } from "cookies-next";

type JsonObject = Record<string, unknown>;

const PAGE_SIZE = 5;

const toneOrder: ArnSipBookItem["tone"][] = ["amber", "blue", "green", "teal", "purple", "red"];

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

function getTone(index: number): ArnSipBookItem["tone"] {
  return toneOrder[index % toneOrder.length];
}

function formatCurrencyInLakhs(paise: number): string {
  const lakhs = paise / 100000;
  if (lakhs >= 10) {
    return `₹${Math.round(lakhs)} L/mo`;
  }
  return `₹${Math.round(lakhs * 10) / 10} L/mo`;
}

function formatAmount(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function getOrdinalSuffix(value: number): string {
  if (value === 1 || value === 21 || value === 31) return "st";
  if (value === 2 || value === 22) return "nd";
  if (value === 3 || value === 23) return "rd";
  return "th";
}

function formatDeductionDay(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "");
  const digits = raw.replace(/\D/g, "");
  const dayNum = digits ? Number(digits) : NaN;
  if (!Number.isFinite(dayNum) || dayNum < 1) return raw || "—";
  return `${dayNum}${getOrdinalSuffix(dayNum)}`;
}

function formatNextSipDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeSummary(summary: ArnSipBookSummary | undefined): ArnSipBookKpis {
  if (!summary) {
    return {
      totalSipBook: "₹0 L/mo",
      totalSipBookInPaise: 0,
      activeSips: 0,
      atRiskSips: 0,
      pausedSips: 0,
      clientsWithSips: 0,
    };
  }

  return {
    totalSipBook: formatCurrencyInLakhs(summary.totalSipBookMonthly),
    totalSipBookInPaise: summary.totalSipBookMonthly,
    activeSips: summary.activeSips,
    atRiskSips: summary.sipsAtRisk ?? summary.atRiskSips ?? 0,
    pausedSips: summary.pausedSips,
    clientsWithSips: summary.activeSipClients,
  };
}

function normalizeInflowTrend(
  data: ArnSipBookInflowTrendPoint[] | undefined
): ArnSipBookTrendPoint[] {
  if (!Array.isArray(data)) return [];
  return data.map((point) => {
    const amount = getNumber(point.amount, 0);
    const valueInPaise = amount;
    const formatted = `₹${Math.round(amount / 1000)}K`;
    return {
      month: point.month,
      monthLabel: getString(point.monthLabel, point.month),
      value: formatted,
      valueInPaise,
    };
  });
}

function normalizeStatus(source: string | undefined): ArnSipBookStatus {
  const status = getString(source).toLowerCase();
  if (status === "paused") return "paused";
  if (status === "at-risk" || status === "risk" || status === "at risk") return "at-risk";
  if (status === "due-today" || status === "due today") return "due-today";
  if (status === "active") return "active";
  return "active";
}

function getStatusLabel(status: ArnSipBookStatus): string {
  switch (status) {
    case "paused":
      return "Paused";
    case "at-risk":
      return "Off Track";
    case "due-today":
      return "Due today";
    case "active":
      return "Active";
    default:
      return "Active";
  }
}

function normalizeSipRow(row: ArnSipBookBackendSip, index: number): ArnSipBookItem {
  const bookStatus = row.bookStatus;
  const backendStatus = getString(row.status);
  const status = normalizeStatus(backendStatus || bookStatus);
  const amountInPaise = getNumber(row.amount, 0);
  const clientName = getString(row.clientName, `Client ${index + 1}`);
  const sipDay = formatDeductionDay(row.deductionDay);
  const nextSipLabel = formatNextSipDate(row.nextSipDate);

  return {
    id: String(row.sipId),
    clientId: String(row.userId),
    clientName,
    initials: getInitials(clientName),
    tone: getTone(index),
    fundName: getString(row.fund, "Fund"),
    amount: formatAmount(amountInPaise),
    amountInPaise,
    sipDay,
    sipDayLabel: sipDay,
    nextSipDate: nextSipLabel,
    nextSipLabel,
    xirr: getNumber(row.xirr, 0),
    status,
    statusLabel: getStatusLabel(status),
  };
}

function applyClientSideFilter(
  sips: ArnSipBookItem[],
  backendSips: ArnSipBookBackendSip[],
  frontendFilter: ArnSipBookFilter
): ArnSipBookItem[] {
  if (frontendFilter === "all") {
    return sips;
  }

  if (frontendFilter === "due-today") {
    const dueIds = new Set(
      backendSips
        .filter((row) => {
          const status = getString(row.status).toLowerCase();
          return status === "due today" || status === "due-today";
        })
        .map((row) => String(row.sipId))
    );
    return sips.filter((sip) => dueIds.has(sip.id));
  }

  if (frontendFilter === "active") {
    const atRiskOrPausedIds = new Set(
      backendSips
        .filter((row) => {
          const bookStatus = getString(row.bookStatus).toLowerCase();
          return bookStatus === "at_risk" || bookStatus === "paused";
        })
        .map((row) => String(row.sipId))
    );
    return sips.filter((sip) => !atRiskOrPausedIds.has(sip.id));
  }

  return sips;
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

export async function fetchSipBook(params: ArnSipBookListParams & {
  type?: string;
  trendPeriod?: string;
  }): Promise<{
    sips: ArnSipBookItem[];
    total: number;
    summary: ArnSipBookKpis;
    inflowTrend: ArnSipBookTrendPoint[];
    health: ArnSipBookHealthData | null;
    filterCounts: Record<string, number> | null;
  }> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.pageSize || PAGE_SIZE));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") {
    const apiStatus = params.status === "at-risk" ? "sips_at_risk" : params.status;
    searchParams.set("filter", apiStatus);
  }
  if (params.type) searchParams.set("type", params.type);
  if (params.trendPeriod) searchParams.set("trendPeriod", params.trendPeriod);

  const payload = await fetchJson<ArnSipBookBackendResponse>(
    `${getApiUrl()}${ArnSipBookEndpoints.SIP_BOOK}?${searchParams.toString()}`
  );

  const backendSips = payload.sips || [];
  let sips = backendSips.map((row, index) => normalizeSipRow(row, index));
  sips = applyClientSideFilter(sips, backendSips, params.status || "all");

  const total = payload.pagination?.totalItems ?? sips.length;

  return {
    sips,
    total,
    summary: normalizeSummary(payload.summary || undefined),
    inflowTrend: normalizeInflowTrend(payload.inflowTrend),
    health: payload.health || null,
    filterCounts: payload.filterCounts || null,
  };
}
