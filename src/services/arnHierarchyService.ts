import { getCookie } from "cookies-next";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
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
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload["message"] === "string"
      ? String(payload["message"])
      : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

export interface HierarchyOption {
  /** Backend EUIN PK; present for real API responses */
  id?: number;
  euinNumber: string;
  label: string;
  name: string;
  email: string;
  phone: string;
  level: string;
  children?: HierarchyOption[];
}

export interface HierarchyResponse {
  viewer: {
    id: string | number;
    name: string;
    euinNumber: string;
  };
  canSwitch: boolean;
  defaultViewPartnerId: string | number;
  hierarchy: HierarchyOption[];
}

type ArnEuinsBackendResponse = {
  success: boolean;
  data?: {
    partnerId?: number;
    arnNumber?: string;
    yourEuinNumber?: string | null;
    euins?: Array<{
      id?: number;
      euinNumber?: string;
      name?: string | null;
      email?: string | null;
      mobileNumber?: string | null;
      isPartner?: boolean;
    }>;
  };
};

export async function getHierarchy(): Promise<HierarchyResponse> {
  const payload = await fetchJson<ArnEuinsBackendResponse>(
    `${getApiUrl()}/arn/euins`
  );

  const data = payload?.data;

  const partnerId = getNumber(data?.partnerId) ?? "";
  const yourEuinNumber =
    typeof data?.yourEuinNumber === "string" ? data!.yourEuinNumber : "";

  const euinRows = Array.isArray(data?.euins) ? data!.euins! : [];

  return {
    viewer: {
      id: partnerId,
      name: "",
      euinNumber: yourEuinNumber || "",
    },
    canSwitch: getBoolean(payload.success, true),
    defaultViewPartnerId: partnerId,
    hierarchy: euinRows
      .map((row) => ({
        id: getNumber(row?.id),
        euinNumber: getString(row?.euinNumber) || "",
        label: row?.isPartner ? "Primary EUIN" : "EUIN",
        name: row?.name ?? "",
        email: row?.email ?? "",
        phone: row?.mobileNumber ?? "",
        // Current UI flattens the tree and only shows EUIN/ARN nodes.
        level: "euin",
      }))
      .filter((row) => row.euinNumber.trim().length > 0),
  };
}

type SaveArnEuinDetailsClientDto = {
  name: string;
  email: string;
  mobileNumber: string;
};

export async function saveArnEuinDetails(
  euinId: number,
  dto: SaveArnEuinDetailsClientDto
): Promise<unknown> {
  return fetchJson<unknown>(`${getApiUrl()}/arn/euins/${euinId}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}
