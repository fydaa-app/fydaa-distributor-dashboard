function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTHENTICATION_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3005"
  );
}

function getOnboardedUserToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/onboardedUserToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getJsonHeaders(token?: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const authToken = token || getOnboardedUserToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

function getAuthHeaders(token?: string): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const authToken = token || getOnboardedUserToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

export class KycApiError extends Error {
  statusCode: number;
  body: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    body: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "KycApiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof KycApiError) return error.statusCode === 401;
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 401
  );
}

function messageFromBody(
  body: Record<string, unknown>,
  fallback: string
): string {
  return typeof body.message === "string" && body.message.trim()
    ? body.message
    : fallback;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

async function authJson<T = Record<string, unknown>>(
  path: string,
  init: RequestInit,
  token?: string,
  fallbackError = "Request failed. Please try again."
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: getJsonHeaders(token),
  });
  const raw = await readBody(response);
  const body = asRecord(raw);

  if (response.status === 401) {
    throw new KycApiError(
      messageFromBody(body, "Session expired. Please sign in again."),
      401,
      body
    );
  }

  if (!response.ok) {
    throw new KycApiError(
      messageFromBody(body, fallbackError),
      response.status,
      body
    );
  }

  return (isRecord(raw) ? raw : { raw }) as T;
}

export interface KycGeolocation {
  latitude: number;
  longitude: number;
}

export interface UpdateKycRequestPayload {
  father_name: string;
  gender: "male" | "female" | "other";
  marital_status: "unmarried" | "married";
  income_slab: string;
  occupation_type: string;
  source_of_wealth: string;
  geolocation: KycGeolocation;
  pep_details: "not_applicable";
}

export interface IdentityDocumentFetch {
  status: string | null;
  reason: string | null;
  redirect_url: string | null;
}

export interface IdentityDocumentResult {
  fetch: IdentityDocumentFetch;
  raw: Record<string, unknown>;
}

export interface KycESignResult {
  status: string | null;
  redirect_url: string | null;
  kycRequestId: string | null;
  reason: string | null;
  raw: Record<string, unknown>;
  nonJsonSuccess: boolean;
}

export interface ReissuedTokens {
  accessToken: string | null;
  refreshToken: string | null;
  raw: Record<string, unknown>;
}

export interface ModifyProofDetails {
  status: string | null;
  fetch_url: string | null;
}

export interface ModifyEsignDetails {
  status: string | null;
  esign_url: string | null;
}

export interface ModifyKycForm {
  id: string | null;
  status: string | null;
  reason: string | null;
  message: string | null;
  signature_provided: boolean;
  proof_details: ModifyProofDetails | null;
  esign_details: ModifyEsignDetails | null;
  raw: Record<string, unknown>;
}

export interface UpdateModifyFormDto {
  father_name: string;
  gender: "male" | "female" | "other";
  marital_status: "unmarried" | "married";
  income_slab: string;
  occupation_type: string;
  source_of_wealth: string;
  geolocation: KycGeolocation;
  pep_details: "no_exposure";
  address: {
    line_1: string;
    line_2: string;
    city: string;
    state: string;
    pincode: string;
  };
  residential_status: "resident";
  country_of_birth: "in";
  place_of_birth: "in";
  spouse_name?: string;
  citizenship_countries: ["in"];
  nationality_country: "in";
  tax_residency_other_than_india: false;
}

export interface PincodeDetails {
  city: string;
  state: string;
}

function parseEsignPayload(
  payload: Record<string, unknown>,
  nonJsonSuccess = false
): KycESignResult {
  const nested = isRecord(payload.data) ? payload.data : null;
  const source =
    nested &&
    (typeof nested.status === "string" || nested.object === "esign")
      ? nested
      : payload;
  const statusRaw = source.status ?? payload.status ?? nested?.status;
  const redirectRaw =
    source.redirect_url ?? payload.redirect_url ?? nested?.redirect_url;
  const kycRequestRaw =
    source.kyc_request ?? payload.kyc_request ?? nested?.kyc_request;
  const reasonRaw =
    source.reason ??
    payload.reason ??
    nested?.reason ??
    source.message ??
    payload.message;
  return {
    status: typeof statusRaw === "string" ? statusRaw : null,
    redirect_url: typeof redirectRaw === "string" ? redirectRaw : null,
    kycRequestId: typeof kycRequestRaw === "string" ? kycRequestRaw : null,
    reason: typeof reasonRaw === "string" ? reasonRaw : null,
    raw: payload,
    nonJsonSuccess,
  };
}

function parseIdentityFetch(payload: Record<string, unknown>): IdentityDocumentFetch {
  const nested = isRecord(payload.data) ? payload.data : null;
  const fetchObj = isRecord(payload.fetch)
    ? payload.fetch
    : isRecord(nested?.fetch)
      ? nested.fetch
      : nested ?? payload;
  const statusRaw = fetchObj.status ?? payload.status ?? nested?.status;
  const reasonRaw = fetchObj.reason ?? payload.reason ?? nested?.reason;
  const redirectRaw =
    fetchObj.redirect_url ?? payload.redirect_url ?? nested?.redirect_url;
  return {
    status: typeof statusRaw === "string" ? statusRaw : null,
    reason: typeof reasonRaw === "string" ? reasonRaw : null,
    redirect_url: typeof redirectRaw === "string" ? redirectRaw : null,
  };
}

function parseModifyForm(payload: Record<string, unknown>): ModifyKycForm {
  const proof = isRecord(payload.proof_details) ? payload.proof_details : null;
  const esign = isRecord(payload.esign_details) ? payload.esign_details : null;
  const idRaw = payload.id;

  return {
    id: typeof idRaw === "string" ? idRaw : idRaw != null ? String(idRaw) : null,
    status: typeof payload.status === "string" ? payload.status : null,
    reason: typeof payload.reason === "string" ? payload.reason : null,
    message: typeof payload.message === "string" ? payload.message : null,
    signature_provided: payload.signature_provided === true,
    proof_details: proof
      ? {
          status: typeof proof.status === "string" ? proof.status : null,
          fetch_url: typeof proof.fetch_url === "string" ? proof.fetch_url : null,
        }
      : null,
    esign_details: esign
      ? {
          status: typeof esign.status === "string" ? esign.status : null,
          esign_url: typeof esign.esign_url === "string" ? esign.esign_url : null,
        }
      : null,
    raw: payload,
  };
}

export function isKycAlreadyInitiated(error: unknown): boolean {
  const statusCode =
    error instanceof KycApiError
      ? error.statusCode
      : typeof error === "object" &&
          error !== null &&
          "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const bodyMessage =
    error instanceof KycApiError && typeof error.body.message === "string"
      ? error.body.message.toLowerCase()
      : "";
  const haystack = `${message} ${bodyMessage}`;
  return (
    statusCode === 409 ||
    haystack.includes("cannot create new kyc request") ||
    haystack.includes("existing request") ||
    (haystack.includes("pending") && haystack.includes("kyc"))
  );
}

export async function initiateKyc(token?: string): Promise<Record<string, unknown>> {
  try {
    return await authJson(
      "/kyc/initiate-kyc",
      { method: "POST", body: JSON.stringify({}) },
      token,
      "Failed to initialize KYC. Please try again."
    );
  } catch (error) {
    if (isKycAlreadyInitiated(error)) {
      return error instanceof KycApiError ? error.body : {};
    }
    if (error instanceof KycApiError) {
      throw error;
    }
    throw new Error("Failed to initialize KYC. Please try again.");
  }
}

export async function updateKycRequest(
  payload: UpdateKycRequestPayload,
  token?: string
): Promise<Record<string, unknown>> {
  return authJson(
    "/kyc/request",
    { method: "PUT", body: JSON.stringify(payload) },
    token,
    "Failed to save KYC details. Please try again."
  );
}

export async function createIdentityDocument(
  postbackUrl = "https://fydaa.com",
  token?: string
): Promise<IdentityDocumentResult> {
  const payload = await authJson(
    "/kyc/identity-document",
    { method: "POST", body: JSON.stringify({ postback_url: postbackUrl }) },
    token,
    "Failed to start DigiLocker. Please try again."
  );
  return { fetch: parseIdentityFetch(payload), raw: payload };
}

export async function getIdentityDocument(
  token?: string
): Promise<IdentityDocumentResult> {
  const payload = await authJson(
    "/kyc/get-identity-document",
    { method: "GET" },
    token,
    "Failed to check DigiLocker status. Please try again."
  );
  return { fetch: parseIdentityFetch(payload), raw: payload };
}

export function normalizeKycSignatureBase64(value: string): string {
  const trimmed = value.trim().replace(/\s/g, "");
  if (trimmed.startsWith("data:")) {
    const comma = trimmed.indexOf(",");
    return comma >= 0 ? trimmed.slice(comma + 1) : trimmed;
  }
  return trimmed;
}

export async function uploadKycSignature(
  base64Png: string,
  token?: string
): Promise<Record<string, unknown>> {
  const signatureData = normalizeKycSignatureBase64(base64Png);
  try {
    return await authJson(
      "/kyc/signature",
      { method: "POST", body: JSON.stringify({ signatureData }) },
      token,
      "Failed to upload signature. Please try again."
    );
  } catch (error) {
    if (!isS3SignatureMismatch(error)) {
      throw error;
    }
    return authJson(
      "/kyc/upload-document",
      {
        method: "POST",
        body: JSON.stringify({
          documentData: signatureData,
          documentType: "signature",
          fileName: "signature.png",
        }),
      },
      token,
      "Failed to upload signature. Please try again."
    );
  }
}

export async function createKycESign(
  postbackUrl = "https://fydaa.com/SuccesspageNSDL",
  token?: string
): Promise<KycESignResult> {
  const payload = await authJson(
    "/kyc/esign",
    { method: "POST", body: JSON.stringify({ postback_url: postbackUrl }) },
    token,
    "Failed to start Aadhaar e-sign. Please try again."
  );
  return parseEsignPayload(payload);
}

export async function getKycESign(token?: string): Promise<KycESignResult> {
  const authToken = token || getOnboardedUserToken();
  const response = await fetch(`${getApiUrl()}/kyc/esign`, {
    method: "GET",
    headers: getJsonHeaders(authToken),
  });
  const raw = await readBody(response);
  const body = asRecord(raw);

  if (response.status === 401) {
    throw new KycApiError(
      messageFromBody(body, "Session expired. Please sign in again."),
      401,
      body
    );
  }

  if (response.status === 500) {
    throw new KycApiError(
      messageFromBody(body, "Something went wrong on our side. Please try again in a moment."),
      500,
      body
    );
  }

  if (!response.ok) {
    throw new KycApiError(
      messageFromBody(body, "Failed to check e-sign status. Please try again."),
      response.status,
      body
    );
  }

  if (typeof raw === "string" || !isRecord(raw)) {
    return {
      status: "successful",
      redirect_url: null,
      kycRequestId: null,
      reason: null,
      raw: { raw },
      nonJsonSuccess: true,
    };
  }

  return parseEsignPayload(raw);
}

export async function syncKycRequestStatus(
  kycRequestId: string,
  token?: string
): Promise<void> {
  await authJson(
    `/kyc/request/${encodeURIComponent(kycRequestId)}/associate`,
    { method: "POST", body: JSON.stringify({}) },
    token,
    "Failed to refresh KYC request status. Please try again."
  );
}

export async function getModifyFormCurrent(
  token?: string
): Promise<ModifyKycForm | null> {
  const authToken = token || getOnboardedUserToken();
  const response = await fetch(`${getApiUrl()}/kyc/kyc-forms/current`, {
    method: "GET",
    headers: getJsonHeaders(authToken),
  });
  const raw = await readBody(response);
  const body = asRecord(raw);

  if (response.status === 401) {
    throw new KycApiError(
      messageFromBody(body, "Session expired. Please sign in again."),
      401,
      body
    );
  }

  if (response.status === 404 || body.notFound === true) {
    return null;
  }

  if (!response.ok) {
    throw new KycApiError(
      messageFromBody(body, "Failed to load KYC form. Please try again."),
      response.status,
      body
    );
  }

  return parseModifyForm(body);
}

export async function getModifyForm(
  id: string,
  token?: string
): Promise<ModifyKycForm> {
  const payload = await authJson(
    `/kyc/kyc-forms/${encodeURIComponent(id)}`,
    { method: "GET" },
    token,
    "Failed to load KYC form. Please try again."
  );
  return parseModifyForm(payload);
}

export async function retryModifyProofFetch(
  id: string,
  token?: string
): Promise<ModifyKycForm> {
  const payload = await authJson(
    `/kyc/kyc-forms/${encodeURIComponent(id)}/retry-proof-fetch`,
    { method: "POST", body: JSON.stringify({}) },
    token,
    "Proof fetch failed. You can retry DigiLocker."
  );
  return parseModifyForm(payload);
}

export async function updateModifyForm(
  id: string,
  dto: UpdateModifyFormDto,
  token?: string
): Promise<ModifyKycForm> {
  const payload = await authJson(
    `/kyc/kyc-forms/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(dto) },
    token,
    "Failed to save KYC details. Please try again."
  );
  return parseModifyForm(payload);
}

export async function uploadModifySignature(
  id: string,
  file: File,
  token?: string
): Promise<ModifyKycForm> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${getApiUrl()}/kyc/kyc-forms/${encodeURIComponent(id)}/signature`,
    {
      method: "POST",
      headers: getAuthHeaders(token),
      body: formData,
    }
  );
  const raw = await readBody(response);
  const body = asRecord(raw);

  if (response.status === 401) {
    throw new KycApiError(
      messageFromBody(body, "Session expired. Please sign in again."),
      401,
      body
    );
  }

  if (!response.ok) {
    throw new KycApiError(
      messageFromBody(body, "Failed to upload signature. Please try again."),
      response.status,
      body
    );
  }

  return parseModifyForm(body);
}

export async function reissueTokens(token?: string): Promise<ReissuedTokens> {
  const payload = await authJson(
    "/user/reissue-tokens",
    { method: "POST", body: JSON.stringify({}) },
    token,
    "Failed to refresh session. Please try again."
  );
  const nested = isRecord(payload.data) ? payload.data : null;
  const accessToken =
    typeof payload.accessToken === "string"
      ? payload.accessToken
      : typeof nested?.accessToken === "string"
        ? nested.accessToken
        : null;
  const refreshToken =
    typeof payload.refreshToken === "string"
      ? payload.refreshToken
      : typeof nested?.refreshToken === "string"
        ? nested.refreshToken
        : null;

  return { accessToken, refreshToken, raw: payload };
}

export async function getPincodeDetails(pin: string): Promise<PincodeDetails> {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
  const data = await response.json().catch(() => null);
  const first = Array.isArray(data) ? data[0] : null;
  const offices =
    isRecord(first) && Array.isArray(first.PostOffice) ? first.PostOffice : [];
  const office = offices.find(isRecord) ?? null;

  if (!office || (isRecord(first) && first.Status !== "Success")) {
    throw new Error("Could not find city and state for this pincode.");
  }

  const city =
    typeof office.District === "string" && office.District.trim()
      ? office.District.trim()
      : typeof office.Name === "string"
        ? office.Name.trim()
        : "";
  const state = typeof office.State === "string" ? office.State.trim() : "";

  if (!city || !state) {
    throw new Error("Could not find city and state for this pincode.");
  }

  return { city, state };
}

export const IDENTITY_SUCCESS_STATUSES = new Set([
  "successful",
  "success",
  "completed",
  "verified",
]);

export const IDENTITY_TERMINAL_FAILURE_STATUSES = new Set(["failed", "expired"]);

export const ESIGN_SUCCESS_STATUSES = new Set([
  "successful",
  "success",
  "completed",
]);

export const ESIGN_FAILURE_STATUSES = new Set([
  "failed",
  "expired",
  "rejected",
  "cancelled",
  "canceled",
  "declined",
  "unsuccessful",
]);

export function isIdentitySuccessStatus(status: string | null): boolean {
  return !!status && IDENTITY_SUCCESS_STATUSES.has(status.toLowerCase());
}

export function isIdentityFailureStatus(status: string | null): boolean {
  return !!status && IDENTITY_TERMINAL_FAILURE_STATUSES.has(status.toLowerCase());
}

export function isEsignSuccessStatus(status: string | null): boolean {
  return !!status && ESIGN_SUCCESS_STATUSES.has(status.toLowerCase());
}

export function isEsignFailureStatus(status: string | null): boolean {
  return !!status && ESIGN_FAILURE_STATUSES.has(status.toLowerCase());
}

export function isSignatureAlreadyStored(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const statusCode =
    error instanceof KycApiError
      ? error.statusCode
      : "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
  const message = error.message.toLowerCase();
  return (
    statusCode === 403 ||
    message.includes("already") ||
    message.includes("permission denied") ||
    message.includes("not allowed") ||
    message.includes("error updating kyc request")
  );
}

function isS3SignatureMismatch(error: unknown): boolean {
  if (!(error instanceof KycApiError) || error.statusCode !== 500) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("does not match the signature") ||
    message.includes("check your key and signing method")
  );
}
