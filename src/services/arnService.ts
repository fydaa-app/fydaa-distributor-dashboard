import { setCookie } from "cookies-next";
import { AuthEndpoints } from "@/config/api-endpoints";

export interface Employee {
  id: number | string;
  name: string;
  email: string;
  role: string;
  arnCode?: string;
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
  const employee =
    getNestedRecord(payload, "employee") ||
    getNestedRecord(payload, "user") ||
    getNestedRecord(data, "employee") ||
    getNestedRecord(data, "user");

  if (employee) return employee;

  if (data && (data.token || data.accessToken)) {
    return data;
  }

  return payload;
}

function normalizeEmployee(source: JsonObject | undefined, email: string): Employee {
  const idValue =
    source?.id ??
    source?.employeeId ??
    source?.arnEmployeeId ??
    source?.arnId ??
    source?._id;

  const id =
    typeof idValue === "number"
      ? idValue
      : typeof idValue === "string"
        ? Number(idValue) || idValue
        : 0;

  const name =
    getString(source?.name) ||
    getString(source?.fullName) ||
    getString(source?.userName) ||
    email.split("@")[0] ||
    "ARN Employee";

  const employeeEmail = getString(source?.email) || email;
  const role =
    getString(source?.role) ||
    getString(source?.designation) ||
    getString(source?.userType) ||
    "ARN";

  const arnCode = getString(source?.arnCode) || getString(source?.arn);

  return {
    id,
    name,
    email: employeeEmail,
    role,
    ...(arnCode ? { arnCode } : {}),
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

function setUserDataCookie(payload: JsonObject, rememberMe: boolean) {
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

  const loginPayload = getLoginPayload(payload);
  const token =
    getString(loginPayload?.token) ||
    getString(loginPayload?.accessToken) ||
    getString(payload && isRecord(payload) ? payload.token : undefined) ||
    getString(payload && isRecord(payload) ? payload.accessToken : undefined);

  if (!token) {
    throw new Error("Login failed. API did not return an auth token.");
  }

  const employee = normalizeEmployee(getEmployeeSource(payload), email);
  const normalizedResponse: LoginResponse = { token, employee };

  setAuthCookies(normalizedResponse, rememberMe);
  setUserDataCookie(payload, rememberMe);

  return normalizedResponse;
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
