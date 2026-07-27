import { ArnLeadEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
import type { ArnLeadsBackendResponse } from "@/types/arnLead";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
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

export interface FetchLeadsParams {
  page: number;
  search?: string;
  type?: string;
}

export async function fetchLeads({
  page,
  search,
  type = "individual",
}: FetchLeadsParams): Promise<ArnLeadsBackendResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", "10");
  searchParams.set("timeframe", "till_date");
  searchParams.set("type", type);
  if (search) {
    searchParams.set("search", search);
  }

  const payload = await fetchJson<ArnLeadsBackendResponse>(
    `${getApiUrl()}${ArnLeadEndpoints.LEAD_USER_LIST}?${searchParams.toString()}`
  );

  return payload;
}
