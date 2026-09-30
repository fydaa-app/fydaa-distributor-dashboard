import { AuthEndpoints } from "@/config/api-endpoints";
import { getCookie } from "cookies-next";

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
}

export interface OtpRequestResponse {
  message: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * `requireAuth: true` attaches the partner session's Bearer token. The
 * forgot/verify OTP endpoints are public and must stay token-free.
 */
async function postJson<T>(
  endpoint: string,
  body: unknown,
  options: { requireAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (options.requireAuth) {
    const authToken = getCookie("authToken");

    if (!authToken) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new Error("Failed to connect to server. Please try again.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // NestJS ValidationPipe returns an array of messages; the global
    // exception filter returns a single string.
    let message = "Request failed. Please try again.";

    if (Array.isArray(payload) && isRecord(payload[0]) && typeof payload[0].message === "string") {
      message = payload[0].message;
    } else if (isRecord(payload)) {
      if (typeof payload.message === "string") {
        message = payload.message;
      } else if (Array.isArray(payload.message) && typeof payload.message[0] === "string") {
        message = payload.message[0];
      }
    }

    throw new Error(message);
  }

  return payload as T;
}

/** Step 1 of the public forgot-password flow. Also used to resend an OTP. */
export function sendPasswordResetOtp(email: string): Promise<OtpRequestResponse> {
  return postJson<OtpRequestResponse>(
    AuthEndpoints.FORGOT_PASSWORD,
    { email: email.trim().toLowerCase() },
  );
}

/** Step 2 of the public forgot-password flow: verify OTP and set a new password. */
export function verifyOtpAndResetPassword(
  payload: VerifyOtpPayload,
): Promise<OtpRequestResponse> {
  return postJson<OtpRequestResponse>(AuthEndpoints.RESET_PASSWORD, {
    email: payload.email.trim().toLowerCase(),
    otp: payload.otp,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  });
}

/** Authenticated password change. Blocked server-side for impersonated sessions. */
export function changePassword(
  payload: ChangePasswordPayload,
): Promise<OtpRequestResponse> {
  return postJson<OtpRequestResponse>(
    AuthEndpoints.CHANGE_PASSWORD,
    {
      email: payload.email.trim().toLowerCase(),
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword,
    },
    { requireAuth: true },
  );
}
