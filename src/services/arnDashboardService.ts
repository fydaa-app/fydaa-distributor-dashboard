import { ArnDashboardEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
import type {
  ArnDashboardAumTrend,
  ArnDashboardResponse,
  ArnDashboardSipBookItem,
  ArnDashboardSummary,
  ArnDashboardTopClient,
} from "@/types/arnDashboard";

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

function getNestedRecord(
  source: JsonObject | undefined,
  key: string
): JsonObject | undefined {
  return source && isRecord(source[key]) ? source[key] : undefined;
}

function formatCurrency(value: unknown): string {
  const num = getNumber(value);
  if (num === 0) {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw || "₹0";
  }
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getArray<T>(value: unknown, mapper: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(mapper);
}

function normalizeSummary(source: JsonObject): ArnDashboardSummary {
  return {
    totalAum: getNumber(source.totalAum),
    totalAumChangePercent: getNumber(source.totalAumChangePercent),
    sipBookMonthly: getNumber(source.sipBookMonthly),
    newSips: getNumber(source.newSips),
    trailEarned: getNumber(source.trailEarned),
    trailEarnedChangePercent: getNumber(source.trailEarnedChangePercent),
    trailEarnedPeriod: getString(source.trailEarnedPeriod),
    sipsAtRisk: getNumber(source.sipsAtRisk),
    clientCount: getNumber(source.clientCount),
  };
}

function normalizeAumTrend(source: JsonObject): ArnDashboardAumTrend[] {
  return getArray(source.aumTrend || source.items || source.data, (item) => {
    const record = isRecord(item) ? item : {};

    return {
      month: getString(record.month || record.label || record.name),
      aum: getNumber(record.aum || record.value || record.amount),
    };
  });
}

function normalizeSipBook(source: JsonObject): ArnDashboardSipBookItem[] {
  return getArray(source.sipBook || source.items || source.data, (item) => {
    const record = isRecord(item) ? item : {};

    return {
      clientName: getString(record.clientName || record.name || record.client),
      sipDay: getString(
        record.sipDay ||
          record.sipDayLabel ||
          record.sip_date ||
          record.nextSipDate
      ),
      amount: formatCurrency(record.amount || record.sipAmount || record.amountText),
      status: getString(record.status || record.sipStatus || record.statusText),
      statusLabel: getString(
        record.statusLabel || record.status_label || record.statusText
      ),
      userId: getNumber(record.userId || record.user_id) || undefined,
    };
  });
}

function normalizeTopClients(source: JsonObject): ArnDashboardTopClient[] {
  return getArray(
    source.topClientsByAum || source.topClients || source.items || source.data,
    (item) => {
      const record = isRecord(item) ? item : {};

      return {
        clientName: getString(record.clientName || record.name || record.fullName),
        aum: getNumber(record.aum || record.aumValue || record.assets),
        investmentModel: getString(
          record.investmentModel || record.model || record.type
        ),
        userId: getNumber(record.userId || record.user_id || record.id),
      };
    }
  );
}

function normalizeDashboardPayload(payload: unknown): ArnDashboardResponse {
  const root = isRecord(payload) ? payload : {};
  const data = getNestedRecord(root, "data") || root;
  const employee = getNestedRecord(data, "employee") || data;

  return {
    success: root.success === false ? false : true,
    employee: {
      id: getNumber(employee.id),
      name: getString(employee.name),
      email: getString(employee.email),
      registrationType: getString(employee.registrationType),
      euin: getString(employee.euin) || null,
    },
    summary: normalizeSummary((data.summary || data) as JsonObject),
    aumTrend: normalizeAumTrend(data),
    sipBook: normalizeSipBook(data),
    topClientsByAum: normalizeTopClients(data),
  };
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  console.group("[arnDashboardService] fetchJson");
  console.log("Request URL:", url);
  console.log("Request options:", options);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const authToken = getCookie("authToken");

  console.log("Auth token exists:", Boolean(authToken));

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    const payload = await response.json().catch(() => null);

    console.log("Raw response payload:", payload);

    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : "Request failed. Please try again.";

      throw new Error(message);
    }

    return payload as T;
  } finally {
    console.groupEnd();
  }
}

async function getArnDashboardFromApi(
  signal?: AbortSignal
): Promise<ArnDashboardResponse> {
  const fullUrl = `${getApiUrl()}${ArnDashboardEndpoints.DASHBOARD}`;

  console.log("[arnDashboardService] Full dashboard URL:", fullUrl);

  const payload = await fetchJson<unknown>(fullUrl, {
    method: "GET",
    signal,
  });

  return normalizeDashboardPayload(payload);
}

export async function getArnDashboard(
  signal?: AbortSignal
): Promise<ArnDashboardResponse> {
  console.group("[arnDashboardService] getArnDashboard");

  console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
  console.log("Dashboard endpoint:", ArnDashboardEndpoints.DASHBOARD);

  try {
    const data = await getArnDashboardFromApi(signal);
    console.log("Normalized dashboard data:", data);
    return data;
  } catch (error) {
    console.error("Dashboard API failed:", error);
    throw error;
  } finally {
    console.groupEnd();
  }
}