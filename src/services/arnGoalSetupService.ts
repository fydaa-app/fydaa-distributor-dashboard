import { ArnGoalSetupEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";

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

export interface GoalSetupClient {
  userId: number;
  name: string;
  mobileNumber: string;
  email: string;
  mandateStatus: "APPROVED" | "CANCELLED" | "PENDING";
  createdAt: string;
}

export interface GoalSetupClientListResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  users: GoalSetupClient[];
}

export async function getGoalSetupClients(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<GoalSetupClientListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  searchParams.set("type", "individual");

  const payload = await fetchJson<GoalSetupClientListResponse>(
    `${getApiUrl()}${ArnGoalSetupEndpoints.CLIENTS}?${searchParams.toString()}`
  );

  return payload;
}
