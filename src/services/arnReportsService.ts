import { ArnReportEndpoints } from "@/config/api-endpoints";
import type { ArnPaginatedResponse } from "@/types/arnClient";
import type {
  ArnPortfolioSummaryParams,
  ArnPortfolioSummaryRow,
  ArnReportDateOption,
  ArnReportPreview,
  ArnReportPreviewParams,
  ArnReportScope,
  ArnReportType,
} from "@/types/arnReports";

type JsonObject = Record<string, unknown>;

//const PAGE_SIZE = 5;
const TOTAL_CLIENTS = 48;

const portfolioSummaryRows: ArnPortfolioSummaryRow[] = [
  {
    id: "rahul-sharma",
    name: "Rahul S.",
    initials: "RS",
    tone: "amber",
    invested: "₹53 L",
    current: "₹62 L",
    pnl: "+₹9 L",
    pnlPositive: true,
    xirr: "14.7%",
    xirrPositive: true,
    sipMonthly: "₹15,000",
    updated: "Today",
  },
  {
    id: "priya-gupta",
    name: "Priya G.",
    initials: "PG",
    tone: "blue",
    invested: "₹43 L",
    current: "₹48 L",
    pnl: "+₹5 L",
    pnlPositive: true,
    xirr: "12.1%",
    xirrPositive: true,
    sipMonthly: "₹25,000",
    updated: "5 Jun",
  },
  {
    id: "nikhil-joshi",
    name: "Nikhil J.",
    initials: "NJ",
    tone: "green",
    invested: "₹43 L",
    current: "₹39 L",
    pnl: "-₹4 L",
    pnlPositive: false,
    xirr: "9.8%",
    xirrPositive: false,
    sipMonthly: "₹0",
    updated: "1 Jun",
  },
  {
    id: "sunita-mehta",
    name: "Sunita M.",
    initials: "SM",
    tone: "teal",
    invested: "₹27 L",
    current: "₹31 L",
    pnl: "+₹4 L",
    pnlPositive: true,
    xirr: "11.3%",
    xirrPositive: true,
    sipMonthly: "₹5,000",
    updated: "Today",
  },
  {
    id: "amit-kumar",
    name: "Amit K.",
    initials: "AK",
    tone: "purple",
    invested: "₹24 L",
    current: "₹28 L",
    pnl: "+₹4 L",
    pnlPositive: true,
    xirr: "16.8%",
    xirrPositive: true,
    sipMonthly: "₹10,000",
    updated: "15 Jun",
  },
];

const previewByReport: Record<ArnReportType, Omit<ArnReportPreview, "reportType" | "scope" | "dateOption">> = {
  valuation: {
    clientCount: 48,
    totalInvested: "₹3.41 Cr",
    currentValue: "₹4.20 Cr",
    unrealisedPnl: "+₹79 L",
    unrealisedPnlPercent: "+23.2%",
    overallXirr: "14.3%",
    estimatedPages: "~96 pages",
  },
  "capital-gains": {
    clientCount: 48,
    totalInvested: "₹3.41 Cr",
    currentValue: "₹4.20 Cr",
    unrealisedPnl: "STCG ₹12 L",
    unrealisedPnlPercent: "LTCG ₹28 L",
    overallXirr: "FY 2025–26",
    estimatedPages: "~64 pages",
  },
  "sip-performance": {
    clientCount: 38,
    totalInvested: "₹1.82 Cr",
    currentValue: "₹2.14 Cr",
    unrealisedPnl: "Avg XIRR",
    unrealisedPnlPercent: "13.8%",
    overallXirr: "62 SIPs",
    estimatedPages: "~48 pages",
  },
  "transaction-history": {
    clientCount: 48,
    totalInvested: "1,248 txns",
    currentValue: "₹18.4 Cr",
    unrealisedPnl: "Last 12 months",
    unrealisedPnlPercent: "All types",
    overallXirr: "SIP + lumpsum",
    estimatedPages: "~120 pages",
  },
  "xirr-summary": {
    clientCount: 48,
    totalInvested: "₹3.41 Cr",
    currentValue: "₹4.20 Cr",
    unrealisedPnl: "Median XIRR",
    unrealisedPnlPercent: "12.9%",
    overallXirr: "14.3%",
    estimatedPages: "~24 pages",
  },
  "aum-statement": {
    clientCount: 48,
    totalInvested: "42 schemes",
    currentValue: "₹4.20 Cr",
    unrealisedPnl: "Top AMC",
    unrealisedPnlPercent: "HDFC 28%",
    overallXirr: "As on today",
    estimatedPages: "~72 pages",
  },
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
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
  return process.env.NEXT_PUBLIC_ARN_REPORTS_API_ENABLED === "true";
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

function getDummyPreview(params: ArnReportPreviewParams): ArnReportPreview {
  const base = previewByReport[params.reportType];
  const clientCount = params.scope === "select-clients" ? 2 : base.clientCount;

  return {
    reportType: params.reportType,
    scope: params.scope,
    dateOption: params.dateOption,
    ...base,
    clientCount,
    estimatedPages: params.scope === "select-clients" ? "~4 pages" : base.estimatedPages,
  };
}

function getDummyPortfolioSummary(
  params: ArnPortfolioSummaryParams
): ArnPaginatedResponse<ArnPortfolioSummaryRow> {
  const start = (params.page - 1) * params.pageSize;
  const items = portfolioSummaryRows.slice(start, start + params.pageSize);

  return {
    items,
    total: TOTAL_CLIENTS,
    page: params.page,
    pageSize: params.pageSize,
  };
}

async function getArnReportPreviewFromApi(
  params: ArnReportPreviewParams,
  signal?: AbortSignal
): Promise<ArnReportPreview> {
  const searchParams = new URLSearchParams({
    reportType: params.reportType,
    scope: params.scope,
    dateOption: params.dateOption,
  });

  const payload = await fetchJson<ArnReportPreview>(
    `${getApiUrl()}${ArnReportEndpoints.REPORT_PREVIEW}?${searchParams.toString()}`,
    { signal }
  );

  return payload;
}

async function getArnPortfolioSummaryFromApi(
  params: ArnPortfolioSummaryParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnPortfolioSummaryRow>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  const payload = await fetchJson<ArnPaginatedResponse<ArnPortfolioSummaryRow>>(
    `${getApiUrl()}${ArnReportEndpoints.PORTFOLIO_SUMMARY}?${searchParams.toString()}`,
    { signal }
  );

  return payload;
}

export async function getArnReportPreview(
  params: ArnReportPreviewParams,
  signal?: AbortSignal
): Promise<ArnReportPreview> {
  if (!isApiEnabled()) {
    return withLatency(getDummyPreview(params));
  }

  return getArnReportPreviewFromApi(params, signal);
}

export async function getArnPortfolioSummary(
  params: ArnPortfolioSummaryParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnPortfolioSummaryRow>> {
  if (!isApiEnabled()) {
    return withLatency(getDummyPortfolioSummary(params));
  }

  return getArnPortfolioSummaryFromApi(params, signal);
}

export async function exportArnPortfolioSummaryCsv(signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
  if (!isApiEnabled()) {
    return withLatency({ ok: true, message: "Portfolio summary CSV export started." });
  }

  await fetchJson<unknown>(`${getApiUrl()}${ArnReportEndpoints.EXPORT_CSV}`, { signal });
  return { ok: true, message: "Portfolio summary CSV export started." };
}

export type { ArnReportType, ArnReportScope, ArnReportDateOption };
