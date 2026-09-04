import { setCookie } from "cookies-next";
import { AuthEndpoints } from "@/config/api-endpoints";

export interface Employee {
  id: number | string;
  name: string;
  email: string;
  role: string;
  arnCode?: string;
  euin?: string;
  referralCode?: string;
  isPartner?: boolean;
  isImpersonation?: boolean;
}

export interface LoginResponse {
  token: string;
  employee: Employee;
}

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function getNestedRecord(value: unknown, key: string): JsonObject | undefined {
  return isRecord(value) && isRecord(value[key]) ? value[key] : undefined;
}

function getLoginPayload(payload: unknown): JsonObject | undefined {
  if (!isRecord(payload)) return undefined;

  const data = getNestedRecord(payload, "data");

  return data || payload;
}

function getEmployeeSource(payload: unknown): JsonObject | undefined {
  if (!isRecord(payload)) return undefined;

  const data = getNestedRecord(payload, "data");
  const partnerFromPayload = getNestedRecord(payload, "partner");
  const partnerFromData = getNestedRecord(data, "partner");
  const employee =
    getNestedRecord(payload, "employee") ||
    getNestedRecord(payload, "user") ||
    getNestedRecord(data, "employee") ||
    getNestedRecord(data, "user") ||
    (partnerFromPayload ? getNestedRecord(partnerFromPayload, "employee") : undefined) ||
    (partnerFromPayload ? getNestedRecord(partnerFromPayload, "user") : undefined) ||
    (partnerFromData ? getNestedRecord(partnerFromData, "employee") : undefined) ||
    (partnerFromData ? getNestedRecord(partnerFromData, "user") : undefined);

  if (employee) return employee;

  if (data && (data.token || data.accessToken)) {
    return data;
  }

  return payload;
}

function getNestedEmployee(source: JsonObject | undefined): JsonObject | undefined {
  const partner = getNestedRecord(source, "partner");
  if (!partner) return undefined;
  return getNestedRecord(partner, "employee") || getNestedRecord(partner, "user");
}

function normalizeEmployee(source: JsonObject | undefined, email: string): Employee {
  const effectiveSource = getNestedEmployee(source) || source;

  const idValue =
    effectiveSource?.id ??
    effectiveSource?.employeeId ??
    effectiveSource?.arnEmployeeId ??
    effectiveSource?.arnId ??
    effectiveSource?._id;

  const id =
    typeof idValue === "number"
      ? idValue
      : typeof idValue === "string"
        ? Number(idValue) || idValue
        : 0;

  const name =
    getString(effectiveSource?.name) ||
    getString(effectiveSource?.fullName) ||
    getString(effectiveSource?.userName) ||
    email.split("@")[0] ||
    "ARN Employee";

  const employeeEmail = getString(effectiveSource?.email) || email;
  const role =
    getString(effectiveSource?.role) ||
    getString(effectiveSource?.designation) ||
    getString(effectiveSource?.userType) ||
    "ARN";

  const arnCode = getString(effectiveSource?.arnCode) || getString(effectiveSource?.arn);
  const euin = getString(effectiveSource?.euin);
  const referralCode = getString(effectiveSource?.referralCode);
  const isPartner =
    getBoolean(effectiveSource?.isPartner) ||
    getBoolean(getNestedRecord(source, "partner")?.isPartner) ||
    getBoolean(source?.isPartner);
  const isImpersonation =
    getBoolean(effectiveSource?.isImpersonation) ||
    getBoolean(getNestedRecord(source, "partner")?.isImpersonation) ||
    getBoolean(source?.isImpersonation);

  return {
    id,
    name,
    email: employeeEmail,
    role,
    isPartner,
    ...(isImpersonation ? { isImpersonation: true } : {}),
    ...(arnCode ? { arnCode } : {}),
    ...(euin ? { euin } : {}),
    ...(referralCode ? { referralCode } : {}),
  };
}

function getApiErrorMessage(payload: unknown): string {
  if (!isRecord(payload)) return "Login failed. Please try again.";

  const data = getNestedRecord(payload, "data");
  const message =
    getString(payload.message) ||
    getString(payload.error) ||
    getString(payload.error_description) ||
    getString(data?.message) ||
    getString(data?.error);

  return message || "Login failed. Please try again.";
}

function getCookieSameSite() {
  const sameSite = process.env.NEXT_PUBLIC_COOKIE_SAME_SITE;

  if (sameSite === "strict") return "strict" as const;
  if (sameSite === "none") return "none" as const;

  return "lax" as const;
}

function getCookieOptions(rememberMe: boolean) {
  const expiresIn = rememberMe ? 30 : 1;

  return {
    expires: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
    path: "/",
    secure:
      process.env.NEXT_PUBLIC_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
    sameSite: getCookieSameSite(),
  };
}

function setAuthCookies(response: LoginResponse, rememberMe: boolean) {
  const cookieOptions = getCookieOptions(rememberMe);

  setCookie("authToken", response.token, cookieOptions);
  setCookie("employeeData", JSON.stringify(response.employee), cookieOptions);
}

function setUserDataCookie(payload: unknown, rememberMe: boolean) {
  if (!isRecord(payload)) return;

  const cookieOptions = getCookieOptions(rememberMe);
  const userData =
    isRecord(payload.userData)
      ? payload.userData
      : isRecord(getNestedRecord(payload, "data")?.userData)
        ? getNestedRecord(payload, "data")?.userData
        : null;

  if (userData) {
    setCookie("userData", JSON.stringify(userData), cookieOptions);
  }
}

function applyArnSession(
  payload: unknown,
  emailFallback: string,
  rememberMe: boolean
): LoginResponse {
  const loginPayload = getLoginPayload(payload);
  const token =
    getString(loginPayload?.token) ||
    getString(loginPayload?.accessToken) ||
    getString(payload && isRecord(payload) ? payload.token : undefined) ||
    getString(payload && isRecord(payload) ? payload.accessToken : undefined);

  if (!token) {
    throw new Error("Login failed. API did not return an auth token.");
  }

  const employee = normalizeEmployee(getEmployeeSource(payload), emailFallback);
  const normalizedResponse: LoginResponse = { token, employee };

  setAuthCookies(normalizedResponse, rememberMe);
  setUserDataCookie(payload, rememberMe);

  return normalizedResponse;
}

export async function loginWithArnApi(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<LoginResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
  const response = await fetch(`${apiUrl}${AuthEndpoints.LOGIN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  return applyArnSession(payload, email, rememberMe);
}

export async function consumeImpersonationToken(token: string): Promise<LoginResponse> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005").trim();
  const response = await fetch(`${apiUrl}${AuthEndpoints.IMPERSONATE_CONSUME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  return applyArnSession(payload, "partner-admin", false);
}

export async function loginTemporarily(
  email: string,
  _password: string,
  rememberMe: boolean
): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const temporaryEmployee: Employee = {
    id: 1,
    name: email.split("@")[0] || "ARN Employee",
    email,
    role: "ARN",
  };

  const temporaryResponse: LoginResponse = {
    token: "temporary-token",
    employee: temporaryEmployee,
  };

  setAuthCookies(temporaryResponse, rememberMe);

  const cookieOptions = getCookieOptions(rememberMe);
  setCookie(
    "userData",
    JSON.stringify({ code: "", number: "", id: 0 }),
    cookieOptions
  );

  return temporaryResponse;
}
