import { ArnPartnerEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

export interface PartnerProfilePhoto {
  hasActiveRm: boolean;
  photoUrl: string | null;
}

export interface PartnerWebsiteReview {
  id?: number;
  customerName: string;
  stars: number;
  customerProfession?: string | null;
  customerTestimonial?: string | null;
  displayOrder?: number;
}

export interface PartnerWebsiteProfile {
  hasActiveRm: boolean;
  photoUrl: string | null;
  name: string | null;
  mobileNumber: string | null;
  about: string | null;
  certifications: string[];
  reviews: PartnerWebsiteReview[];
  websiteSlug: string | null;
  websitePath: string | null;
  websiteUrl: string | null;
  created?: boolean;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  const authToken = getCookie("authToken");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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

export async function fetchPartnerProfilePhoto(): Promise<PartnerProfilePhoto> {
  const response = await fetchJson<{
    success: boolean;
    data: { hasActiveRm: boolean; photoUrl: string | null };
  }>(`${getApiUrl()}${ArnPartnerEndpoints.PROFILE_PHOTO}`);

  return {
    hasActiveRm: response.data?.hasActiveRm ?? false,
    photoUrl: response.data?.photoUrl ?? null,
  };
}

export async function uploadPartnerProfilePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("photo", file);

  const headers = new Headers();
  const authToken = getCookie("authToken");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(
    `${getApiUrl()}${ArnPartnerEndpoints.PROFILE_PHOTO}`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Image upload failed";
    throw new Error(message);
  }

  const photoUrl =
    isRecord(payload) && isRecord(payload.data) && typeof payload.data.photoUrl === "string"
      ? payload.data.photoUrl
      : "";

  if (!photoUrl) {
    throw new Error("Image upload failed");
  }

  return photoUrl;
}

function normalizeWebsiteProfile(data: Partial<PartnerWebsiteProfile> | null | undefined): PartnerWebsiteProfile {
  return {
    hasActiveRm: data?.hasActiveRm ?? false,
    photoUrl: data?.photoUrl ?? null,
    name: data?.name ?? null,
    mobileNumber: data?.mobileNumber ?? null,
    about: data?.about ?? null,
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    reviews: Array.isArray(data?.reviews) ? data.reviews : [],
    websiteSlug: data?.websiteSlug ?? null,
    websitePath: data?.websitePath ?? null,
    websiteUrl: data?.websiteUrl ?? null,
    created: data?.created,
  };
}

export async function fetchPartnerWebsite(): Promise<PartnerWebsiteProfile> {
  const response = await fetchJson<{
    success: boolean;
    data: PartnerWebsiteProfile;
  }>(`${getApiUrl()}${ArnPartnerEndpoints.WEBSITE}`);

  return normalizeWebsiteProfile(response.data);
}

export async function upsertPartnerWebsite(payload: {
  about: string;
  certifications: string[];
  reviews: PartnerWebsiteReview[];
}): Promise<PartnerWebsiteProfile> {
  const response = await fetchJson<{
    success: boolean;
    message?: string;
    data: PartnerWebsiteProfile;
  }>(`${getApiUrl()}${ArnPartnerEndpoints.WEBSITE}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizeWebsiteProfile(response.data);
}
