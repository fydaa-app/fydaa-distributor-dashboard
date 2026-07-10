import { ArnReportEndpoints } from "@/config/api-endpoints";
import type { ArnTone } from "@/types/arnClient";
import type {
  ArnPortfolioSummaryRow,
  ArnQuickReportItem,
  ArnReportDateOption,
  ArnReportPreview,
  ArnReportType,
  ArnReportsPagination,
  ArnReportsParams,
  ArnReportsResult,
} from "@/types/arnReports";

type JsonObject = Record<string, unknown>;

const TONES: ArnTone[] = ["amber", "blue", "green", "teal", "purple", "red"];

const CANONICAL_REPORT_TYPES: ArnReportType[] = [
  "valuation",
  "capital-gains",
  "sip-performance",
  "transaction-history",
  "xirr-summary",
  "aum-statement",
];

const REPORT_DESCRIPTIONS: Record<ArnReportType, string> = {
  valuation: "Current value + P&L",
  "capital-gains": "STCG / LTCG for tax",
  "sip-performance": "XIRR per SIP",
  "transaction-history": "Full ledger by date",
  "xirr-summary": "Returns all clients",
  "aum-statement": "Scheme-wise snapshot",
};

function normalizeReportType(raw: unknown): ArnReportType {
  if (typeof raw === "string") {
    const candidate = raw.trim().replace(/_/g, "-").toLowerCase();
    if ((CANONICAL_REPORT_TYPES as string[]).includes(candidate)) {
      return candidate as ArnReportType;
    }
  }
  return "valuation";
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]*)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]) || null;
  } catch {
    return match[1] || null;
  }
}

function formatCurrency(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw || "₹0";
  }
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatSignedCurrency(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "₹0";
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  return `${sign}₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "0%";
  return `${num}%`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function getNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const authToken = getAuthToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
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

function buildArnReportPreview(
  reportType: ArnReportType,
  summary: JsonObject | undefined,
  pagination: ArnReportsPagination
): ArnReportPreview {
  const s = summary || {};

  return {
    reportType,
    clientCount: getNumber(s.clientCount),
    totalInvested: formatCurrency(s.totalInvested),
    currentValue: formatCurrency(s.currentValue),
    unrealisedPnl: formatSignedCurrency(s.unrealizedPnl ?? s.unrealisedPnl),
    unrealisedPnlPercent: formatPercent(s.unrealizedPnlPercent ?? s.unrealisedPnlPercent),
    overallXirr: formatPercent(s.overallXirr),
    estimatedPages: pagination.totalPages
      ? `~${pagination.totalPages} pages`
      : "—",
  };
}

function mapClientRow(row: JsonObject, index: number): ArnPortfolioSummaryRow {
  const invested = getNumber(row.invested ?? row.totalInvested ?? row.investedAmount);
  const current = getNumber(row.current ?? row.currentValue ?? row.currentAmount);
  const pnl = getNumber(row.pnl ?? row.unrealizedPnl ?? row.unrealisedPnl);
  const xirr = getNumber(row.xirr);

  return {
    id: String(row.userId ?? row.id ?? index),
    name: typeof row.name === "string" ? row.name : typeof row.clientName === "string" ? row.clientName : "Unknown",
    initials: getInitials(typeof row.name === "string" ? row.name : typeof row.clientName === "string" ? row.clientName : ""),
    tone: TONES[index % TONES.length],
    invested: formatCurrency(invested),
    current: formatCurrency(current),
    pnl: formatSignedCurrency(pnl),
    pnlPositive: pnl >= 0,
    xirr: formatPercent(xirr),
    xirrPositive: xirr >= 0,
    sipMonthly:
      row.sipMonthly !== undefined && row.sipMonthly !== null
        ? formatCurrency(row.sipMonthly)
        : undefined,
    updated:
      row.updated !== undefined && row.updated !== null
        ? String(row.updated)
        : undefined,
  };
}

export async function getArnReports(
  params: ArnReportsParams,
  signal?: AbortSignal
): Promise<ArnReportsResult> {
  const searchParams = new URLSearchParams({
    reportType: params.reportType,
    page: String(params.page),
    limit: String(params.limit),
    type: params.type || "individual",
  });

  if (params.asOfDate) {
    searchParams.set("asOfDate", params.asOfDate);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const payload = await fetchJson<JsonObject>(
    `${getApiUrl()}${ArnReportEndpoints.REPORTS}?${searchParams.toString()}`,
    { signal }
  );

  const data = isRecord(payload.data) ? payload.data : payload;
  const summary = isRecord(data.summary) ? data.summary : undefined;
  const clientsRaw = Array.isArray(data.clients) ? data.clients : [];
  const rawPagination = isRecord(data.pagination) ? data.pagination : {};

  const pagination: ArnReportsPagination = {
    page: getNumber(rawPagination.page) || params.page,
    totalPages: getNumber(rawPagination.totalPages),
    totalCount: getNumber(rawPagination.totalCount ?? rawPagination.totalItems),
  };

  const clients = clientsRaw
    .filter((row): row is JsonObject => isRecord(row))
    .map((row, index) => mapClientRow(row, index));

  return {
    preview: buildArnReportPreview(params.reportType, summary, pagination),
    clients,
    pagination,
  };
}

export async function getArnQuickReports(
  signal?: AbortSignal
): Promise<ArnQuickReportItem[]> {
  const payload = await fetchJson<JsonObject>(
    `${getApiUrl()}${ArnReportEndpoints.QUICK_REPORTS}`,
    { signal }
  );

  const data = isRecord(payload.data) ? payload.data : payload;
  const rawList = Array.isArray(data.quickReports)
    ? data.quickReports
    : Array.isArray(payload.quickReports)
      ? payload.quickReports
      : [];

  return rawList
    .filter((item): item is JsonObject => isRecord(item))
    .map((item) => {
      const type = normalizeReportType(item.id ?? item.type);
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title
          : typeof item.name === "string" && item.name.trim()
            ? item.name
            : REPORT_DESCRIPTIONS[type];
      const description =
        typeof item.description === "string" && item.description.trim()
          ? item.description
          : REPORT_DESCRIPTIONS[type];

      return { id: type, title, description };
    });
}

export type { ArnReportType, ArnReportDateOption };
