import { ArnLeadEndpoints, ReferralEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";
import type {
  ArnLead,
  ArnLeadsBackendResponse,
  CreateLeadPayload,
  UpdateLeadPayload,
  AssignLeadPayload,
  FetchLeadsParams,
  PartnerLeadStats,
} from "@/types/arnLead";

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

function replacePathParams(path: string, params: Record<string, string | number>): string {
  return path.replace(/{(\w+)}/g, (_, key) => String(params[key]));
}

function sanitizeNumericFields<T extends Record<string, unknown>>(data: T): T {
  const numericFields = ["potentialInvestment", "convertedAmount", "priority", "assignedToId"];
  const result: Record<string, unknown> = { ...data };
  for (const field of numericFields) {
    if (result[field] !== undefined && result[field] !== null && result[field] !== "") {
      const num = Number(result[field]);
      if (!Number.isNaN(num)) {
        result[field] = num;
      }
    }
  }
  return result as T;
}

export async function fetchPartnerLeads(params: FetchLeadsParams): Promise<ArnLeadsBackendResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", "10");
  if (params.search) searchParams.set("search", params.search);
  if (params.source) searchParams.set("source", params.source);
  if (params.status) searchParams.set("status", params.status);
  if (params.assignedToId) searchParams.set("assignedToId", String(params.assignedToId));
  if (params.generatedById) searchParams.set("generatedById", String(params.generatedById));
  if (params.priority !== undefined) searchParams.set("priority", String(params.priority));
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);
  if (params.type) searchParams.set("type", params.type);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.followUpTimeframe) searchParams.set("followUpTimeframe", params.followUpTimeframe);
  if (params.showOverdueOnly) searchParams.set("showOverdueOnly", String(params.showOverdueOnly));
  searchParams.set("generatedByType", "PARTNER");

  const payload = await fetchJson<ArnLeadsBackendResponse>(
    `${getApiUrl()}${ArnLeadEndpoints.PARTNER_LEAD_LIST}?${searchParams.toString()}`
  );

  return payload;
}

export async function fetchLeads(params: FetchLeadsParams): Promise<ArnLeadsBackendResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", "10");
  if (params.search) searchParams.set("search", params.search);
  if (params.source) searchParams.set("source", params.source);
  if (params.status) searchParams.set("status", params.status);
  if (params.assignedToId) searchParams.set("assignedToId", String(params.assignedToId));
  if (params.generatedById) searchParams.set("generatedById", String(params.generatedById));
  if (params.priority !== undefined) searchParams.set("priority", String(params.priority));
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);
  if (params.type) searchParams.set("type", params.type);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.followUpTimeframe) searchParams.set("followUpTimeframe", params.followUpTimeframe);
  if (params.showOverdueOnly) searchParams.set("showOverdueOnly", String(params.showOverdueOnly));

  const payload = await fetchJson<ArnLeadsBackendResponse>(
    `${getApiUrl()}${ArnLeadEndpoints.LEAD_USER_LIST}?${searchParams.toString()}`
  );

  return payload;
}

export async function createPartnerLead(data: CreateLeadPayload): Promise<ArnLead> {
  const payload = sanitizeNumericFields({ ...data, appType: "Fydaa" });
  const response = await fetchJson<{ success: boolean; message: string; data: ArnLead }>(
    `${getApiUrl()}${ArnLeadEndpoints.PARTNER_LEADS}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

export async function updatePartnerLead(leadId: number, data: UpdateLeadPayload): Promise<ArnLead> {
  const path = replacePathParams(ArnLeadEndpoints.PARTNER_LEAD_BY_ID, { leadId });
  const payload = sanitizeNumericFields({ ...data, appType: "Fydaa" });
  const response = await fetchJson<{ success: boolean; message: string; data: ArnLead }>(
    `${getApiUrl()}${path}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

export async function uploadLeadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const headers = new Headers();
  const authToken = getCookie("authToken");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${getApiUrl()}${ReferralEndpoints.LEAD_UPLOAD_IMAGE}`, {
    method: "POST",
    headers,
    body: formData,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Image upload failed";
    throw new Error(message);
  }

  const imageUrl =
    isRecord(payload) && typeof payload.imageUrl === "string"
      ? payload.imageUrl
      : isRecord(payload) && isRecord(payload.data) && typeof payload.data.imageUrl === "string"
        ? payload.data.imageUrl
        : "";

  if (!imageUrl) {
    throw new Error("Image upload failed");
  }

  return imageUrl;
}

function isPartnerLeadStats(value: unknown): value is PartnerLeadStats {
  return (
    isRecord(value) &&
    typeof value.total === "number" &&
    typeof value.new === "number" &&
    typeof value["in-progress"] === "number" &&
    typeof value.converted === "number" &&
    typeof value.lost === "number" &&
    typeof value.conversionRate === "number"
  );
}

export async function fetchPartnerLeadStats(): Promise<PartnerLeadStats> {
  const response = await fetchJson<unknown>(`${getApiUrl()}${ArnLeadEndpoints.PARTNER_LEAD_STATS}`);
  if (isRecord(response) && isPartnerLeadStats(response.data)) {
    return response.data;
  }
  if (isPartnerLeadStats(response)) {
    return response;
  }
  throw new Error("Failed to load stats");
}

export async function assignPartnerLead(leadId: number, data: AssignLeadPayload): Promise<ArnLead> {
  const path = replacePathParams(ArnLeadEndpoints.PARTNER_LEAD_ASSIGN, { leadId });
  const response = await fetchJson<{ success: boolean; message: string; data: ArnLead }>(
    `${getApiUrl()}${path}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return response.data;
}