function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAuthHeaders() {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (typeof document !== "undefined") {
    const match = document.cookie.match(/authToken=([^;]+)/);
    const authToken = match ? decodeURIComponent(match[1]) : "";
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
  }

  return headers;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_AUTHENTICATION_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

function getOnboardingApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL || "https://onboarding.fydaa.com"
  );
}

function getOnboardedUserToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/onboardedUserToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "server-" + Math.random().toString(36).slice(2);
  }

  const storageKey = "fydaa_device_id";
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    try {
      localStorage.setItem(storageKey, deviceId);
    } catch {
      deviceId = "fallback-" + Math.random().toString(36).slice(2);
    }
  }

  return deviceId;
}

export interface RequestArnOtpParams {
  callingCode: string;
  mobileNumber: string;
  referredBy: string;
}

export async function requestArnOtp({
  callingCode,
  mobileNumber,
  referredBy,
}: RequestArnOtpParams): Promise<void> {
  const url = `${getApiUrl()}/auth/requestOtp`;

  const payload = {
    callingCode,
    mobileNumber,
    deviceId: getDeviceId(),
    fromApp: "fydaa",
    referredBy: referredBy || "",
    isWhatsappOptin: 1,
  };

  console.log("[ONBOARD] requestOtp payload =>", JSON.stringify(payload));

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to send OTP. Please try again.";
    throw new Error(message);
  }
}

export async function verifyArnOtp(params: {
  mobileNumber: string;
  otp: string;
}): Promise<{ message: string; data: Record<string, unknown> }> {
  const url = `${getApiUrl()}/auth/verifyOtp`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "OTP verification failed. Please try again.";
    throw new Error(message);
  }

  const message =
    (data && typeof data === "object" && typeof data.message === "string"
      ? data.message
      : "OTP verified");

  const responseData =
    (data && typeof data === "object" && isRecord(data.data) ? data.data : null) ||
    (typeof data === "string" ? { raw: data } : {});

  return { message, data: responseData };
}

export async function requestLinkEmail(
  params: { email: string },
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/user/requestLinkEmail`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to send email verification link. Please try again.";
    throw new Error(message);
  }

  return (data && typeof data === "object" && isRecord(data)
    ? data
    : {}) as Record<string, unknown>;
}

export async function verifyLinkEmail(
  params: { email: string; otp: string },
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/user/verifyLinkEmail`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Email verification failed. Please try again.";
    throw new Error(message);
  }

  return (data && typeof data === "object" && isRecord(data)
    ? data
    : {}) as Record<string, unknown>;
}

export interface RiskProfileOption {
  answer: string;
  points: string;
}

export interface RiskProfileQuestion {
  id: number;
  secondaryQuestionId: string;
  question: string;
  option: RiskProfileOption[];
  range: string | null;
  imageUrl: string | null;
  backgroundImageUrl: string | null;
  title: string | null;
  description: string | null;
  questionType: string;
  questionCategory: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateRiskProfileOption {
  answerId: number;
  questionId: number;
  secondaryQuestionId: string;
}

export async function getRiskProfileQuestionnaire(
  token?: string
): Promise<RiskProfileQuestion[]> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getOnboardingApiUrl()}/risk-profile-questionnaire/getRiskProfileQuestionnaire`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, { method: "GET", headers });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to load risk profile questions. Please try again.";
    throw new Error(message);
  }

  const questions = Array.isArray(data) ? data : [];

  return questions
    .filter(
      (q): q is RiskProfileQuestion =>
        isRecord(q) && q.questionType === "OPTION" && Array.isArray(q.option)
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function createUserRiskProfile(
  options: CreateRiskProfileOption[],
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getOnboardingApiUrl()}/risk-profile/createUserRiskProfile`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ option: options }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to submit risk profile. Please try again.";
    throw new Error(message);
  }

  return (data && typeof data === "object" && isRecord(data.data)
    ? data.data
    : isRecord(data)
      ? data
      : {}) as Record<string, unknown>;
}

export interface UserStage {
  isRiskProfileComplete: boolean;
  isKycCompliant?: boolean;
  isEmail?: boolean;
  isBank?: boolean;
  isNominee?: boolean;
  [key: string]: unknown;
}

export async function getUserStage(token?: string): Promise<UserStage> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/user/getUserStage`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, { method: "GET", headers });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to fetch user stage. Please try again.";
    throw new Error(message);
  }

  return (isRecord(data) ? data : {}) as UserStage;
}

export async function selectInvestmentModel(
  investmentModel: string,
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/user/select-investment-model`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ investmentModel }),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to set investment model. Please try again.";
    throw new Error(message);
  }

  return (isRecord(data) ? data : {}) as Record<string, unknown>;
}

export async function getRiskIndicators(
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getOnboardingApiUrl()}/risk-profile/getIndicators`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, { method: "GET", headers });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to load risk indicators. Please try again.";
    throw new Error(message);
  }

  return (data && typeof data === "object" && isRecord(data.data)
    ? data.data
    : isRecord(data)
      ? data
      : {}) as Record<string, unknown>;
}

export interface KycFetchParams {
  pan: string;
  date_of_birth: string;
  name: string;
}

export interface KycFetchIssue {
  field: string;
  code: string;
  reason: string;
}

export interface KycFetchResult {
  status: boolean;
  message: string;
  data: Record<string, unknown> | null;
  isKycCompliant: boolean;
  reason: string | null;
  action: string | null;
  issues: KycFetchIssue[];
  recommendations: string[];
  verificationStatus: Record<string, unknown> | null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item);
}

function asIssueArray(value: unknown): KycFetchIssue[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is KycFetchIssue =>
        isRecord(item) &&
        typeof item.field === "string" &&
        typeof item.code === "string" &&
        typeof item.reason === "string"
    )
    .map((item) => ({
      field: item.field,
      code: item.code,
      reason: item.reason,
    }));
}

export async function fetchKycData(
  params: KycFetchParams,
  token?: string
): Promise<KycFetchResult> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/kyc/fetch-kyc-data`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "KYC verification failed. Please try again.";
    throw new Error(message);
  }

  return {
    status: payload.status === true,
    message:
      typeof payload.message === "string" ? payload.message : "",
    data: isRecord(payload.data) ? payload.data : null,
    isKycCompliant: payload.isKycCompliant === true,
    reason: typeof payload.reason === "string" ? payload.reason : null,
    action: typeof payload.action === "string" ? payload.action : null,
    issues: asIssueArray(payload.issues),
    recommendations: asStringArray(payload.recommendations),
    verificationStatus: isRecord(payload.verificationStatus)
      ? payload.verificationStatus
      : null,
  };
}

export interface KycExtraParams {
  father_name: string;
  gender: "male" | "female" | "others";
  marital_status: "single" | "married";
  income_slab:
    | "upto_1lakh"
    | "above_1lakh_upto_5lakh"
    | "above_5lakh_upto_10lakh"
    | "above_10lakh_upto_25lakh"
    | "above_25lakh_upto_1cr"
    | "above_1cr";
  occupation_type:
    | "private_sector"
    | "public_sector"
    | "government_sector"
    | "business"
    | "professional"
    | "retired"
    | "housewife"
    | "student"
    | "others";
}

export async function submitKycExtra(
  params: KycExtraParams,
  token?: string
): Promise<{ status: boolean; message: string }> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/kyc/kyc-extra`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to save profile details. Please try again.";
    throw new Error(message);
  }

  return {
    status: payload.status === true,
    message: typeof payload.message === "string" ? payload.message : "",
  };
}

export type NomineeRelationship =
  | "father"
  | "mother"
  | "court_appointed_legal_guardian"
  | "aunt"
  | "brother_in_law"
  | "brother"
  | "daughter"
  | "daughter_in_law"
  | "father_in_law"
  | "grand_daughter"
  | "grand_father"
  | "grand_mother"
  | "grand_son"
  | "mother_in_law"
  | "nephew"
  | "niece"
  | "sister"
  | "sister_in_law"
  | "son"
  | "son_in_law"
  | "spouse"
  | "uncle"
  | "others";

export interface NomineePhoneNumber {
  isd: string;
  number: string;
}

export interface NomineeAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface CreateNomineeDto {
  nominee_name: string;
  nominee_dob: string;
  allocation_percentage: number;
  nominee_relationship: NomineeRelationship;
  nominee_order: number;
  nominee_pan: string;
  nominee_aadhaar_number: string;
  nominee_email_address: string;
  nominee_phone_number: NomineePhoneNumber;
  nominee_address?: NomineeAddress;
  guardian_name?: string;
  guardian_relationship?: NomineeRelationship;
  guardian_pan?: string;
  guardian_email_address?: string;
  guardian_phone_number?: NomineePhoneNumber;
  guardian_address?: NomineeAddress;
}

export interface CreateNominationPayload {
  opt_out_nomination?: boolean;
  nominees?: CreateNomineeDto[];
}

export async function createNominationDetails(
  payload: CreateNominationPayload,
  token?: string
): Promise<Record<string, unknown>> {
  const authToken = token || getOnboardedUserToken();
  const url = `${getApiUrl()}/kyc/nominee`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (response.status === 409) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) || "You have already added a nominee.";
    const error = new Error(message) as Error & { isConflict?: boolean };
    error.isConflict = true;
    throw error;
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null) ||
      "Failed to save nominee. Please try again.";
    throw new Error(message);
  }

  return (data && typeof data === "object" && isRecord(data)
    ? data
    : {}) as Record<string, unknown>;
}
