import { ArnShareEndpoints } from "@/config/api-endpoints";
import type { ArnPaginatedResponse } from "@/types/arnClient";
import type {
  ArnRecentShare,
  ArnRecentSharesParams,
  ArnShareChannel,
  ArnShareClientOption,
  ArnShareKpis,
  ArnSharePayload,
  ArnShareResponse,
} from "@/types/arnShare";

type JsonObject = Record<string, unknown>;

//const PAGE_SIZE = 5;
const TOTAL_SHARES = 34;

const shareKpis: ArnShareKpis = {
  reportsShared: 34,
  reportsSharedTrend: "+8 vs May",
  viewedByClients: 28,
  viewedRate: "82% open rate",
  whatsappSends: 22,
  whatsappLabel: "top channel",
};

const shareClients: ArnShareClientOption[] = [
  { id: "rahul-sharma", name: "Rahul Sharma", initials: "RS", tone: "amber", aum: "₹62 L", xirr: 14.7 },
  { id: "priya-gupta", name: "Priya Gupta", initials: "PG", tone: "blue", aum: "₹48 L", xirr: 12.1 },
  { id: "nikhil-joshi", name: "Nikhil Joshi", initials: "NJ", tone: "green", aum: "₹39 L", xirr: 9.8 },
  { id: "sunita-mehta", name: "Sunita Mehta", initials: "SM", tone: "teal", aum: "₹31 L", xirr: 11.3 },
  { id: "amit-kumar", name: "Amit Kumar", initials: "AK", tone: "purple", aum: "₹28 L", xirr: 16.8 },
];

const recentShares: ArnRecentShare[] = [
  {
    id: "share-1",
    clientId: "rahul-sharma",
    clientName: "Rahul Sharma",
    clientShortName: "Rahul S.",
    initials: "RS",
    tone: "amber",
    reportType: "Valuation",
    reportTypeKey: "valuation",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    sentOn: "5 Jun",
    viewed: true,
  },
  {
    id: "share-2",
    clientId: "amit-kumar",
    clientName: "Amit Kumar",
    clientShortName: "Amit K.",
    initials: "AK",
    tone: "purple",
    reportType: "Capital gains",
    reportTypeKey: "capital_gains",
    channel: "email",
    channelLabel: "Email",
    sentOn: "2 Jun",
    viewed: true,
  },
  {
    id: "share-3",
    clientId: "sunita-mehta",
    clientName: "Sunita Mehta",
    clientShortName: "Sunita M.",
    initials: "SM",
    tone: "teal",
    reportType: "SIP performance",
    reportTypeKey: "sip_performance",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    sentOn: "28 May",
    viewed: false,
  },
];

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function replacePathParams(path: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, encodeURIComponent(value)),
    path
  );
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
  return process.env.NEXT_PUBLIC_ARN_SHARE_API_ENABLED === "true";
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

function getDummyRecentShares(
  params: ArnRecentSharesParams
): ArnPaginatedResponse<ArnRecentShare> {
  const start = (params.page - 1) * params.pageSize;
  const items = recentShares.slice(start, start + params.pageSize);

  return {
    items,
    total: TOTAL_SHARES,
    page: params.page,
    pageSize: params.pageSize,
  };
}

function getChannelLabel(channel: ArnShareChannel): string {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "email") return "Email";
  if (channel === "copy-link") return "Copy link";
  return "Download PDF";
}

function getClientNames(clientIds: string[]): string[] {
  return clientIds
    .map((id) => shareClients.find((client) => client.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

async function getArnShareKpisFromApi(signal?: AbortSignal): Promise<ArnShareKpis> {
  return fetchJson<ArnShareKpis>(`${getApiUrl()}${ArnShareEndpoints.SHARE_KPIS}`, { signal });
}

async function getArnShareClientsFromApi(signal?: AbortSignal): Promise<ArnShareClientOption[]> {
  const payload = await fetchJson<{ items: ArnShareClientOption[] }>(
    `${getApiUrl()}${ArnShareEndpoints.RECENT_SHARES}/clients`,
    { signal }
  );
  return payload.items;
}

async function getArnRecentSharesFromApi(
  params: ArnRecentSharesParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnRecentShare>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  return fetchJson<ArnPaginatedResponse<ArnRecentShare>>(
    `${getApiUrl()}${ArnShareEndpoints.RECENT_SHARES}?${searchParams.toString()}`,
    { signal }
  );
}

async function sendArnShareFromApi(payload: ArnSharePayload, signal?: AbortSignal): Promise<ArnShareResponse> {
  return fetchJson<ArnShareResponse>(`${getApiUrl()}${ArnShareEndpoints.SEND}`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

async function resendArnShareFromApi(shareId: string, signal?: AbortSignal): Promise<ArnShareResponse> {
  const endpoint = replacePathParams(ArnShareEndpoints.RESEND, { shareId });
  return fetchJson<ArnShareResponse>(`${getApiUrl()}${endpoint}`, {
    method: "POST",
    signal,
  });
}

export async function getArnShareKpis(signal?: AbortSignal): Promise<ArnShareKpis> {
  if (!isApiEnabled()) {
    return withLatency(shareKpis);
  }

  return getArnShareKpisFromApi(signal);
}

export async function getArnShareClients(signal?: AbortSignal): Promise<ArnShareClientOption[]> {
  if (!isApiEnabled()) {
    return withLatency(shareClients);
  }

  return getArnShareClientsFromApi(signal);
}

export async function getArnRecentShares(
  params: ArnRecentSharesParams,
  signal?: AbortSignal
): Promise<ArnPaginatedResponse<ArnRecentShare>> {
  if (!isApiEnabled()) {
    return withLatency(getDummyRecentShares(params));
  }

  return getArnRecentSharesFromApi(params, signal);
}

export async function sendArnShare(payload: ArnSharePayload, signal?: AbortSignal): Promise<ArnShareResponse> {
  if (!isApiEnabled()) {
    const names = getClientNames(payload.clientIds);
    const channel = getChannelLabel(payload.channel);
    const message =
      names.length === 1
        ? `${names[0]} will receive their report shortly.`
        : `${names.slice(0, 2).join(" and ")}${names.length > 2 ? ` and ${names.length - 2} more` : ""} will receive their report shortly.`;

    return withLatency({
      ok: true,
      message: `Reports sent via ${channel}. ${message}`,
    });
  }

  return sendArnShareFromApi(payload, signal);
}

export async function resendArnShare(shareId: string, signal?: AbortSignal): Promise<ArnShareResponse> {
  if (!isApiEnabled()) {
    return withLatency({ ok: true, message: "Report resend request created." });
  }

  return resendArnShareFromApi(shareId, signal);
}

export type { ArnShareChannel };
