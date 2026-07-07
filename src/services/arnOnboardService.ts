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
