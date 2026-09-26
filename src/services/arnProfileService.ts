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

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  const authToken = getCookie("authToken");
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
