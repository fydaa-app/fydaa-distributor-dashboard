export type AccountType = "savings" | "current" | "nre" | "nro";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAuthHeaders() {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (typeof document !== "undefined") {
    const match = document.cookie.match(/onboardedUserToken=([^;]+)/);
    const authToken = match ? decodeURIComponent(match[1]) : "";
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
  }

  return headers;
}

function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AUTHENTICATION_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3005"
  );
}

function getPaymentApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PAYMENT_API_URL || "https://payment.fydaa.com"
  );
}

/**
 * Resolve the client's public IPv4 address in the browser only.
 * Uses api4.ipify.org which returns IPv4-only, with an 8s timeout and a
 * strict IPv4 validation. Throws if no valid IPv4 can be determined.
 */
export async function getClientIp(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch("https://api4.ipify.org?format=json", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unable to determine client IPv4: ${response.status}`);
    }

    const data: unknown = await response.json();

    const ip =
      typeof data === "object" &&
      data !== null &&
      "ip" in data &&
      typeof data.ip === "string"
        ? data.ip.trim()
        : "";

    const ipv4Pattern =
      /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

    if (!ipv4Pattern.test(ip)) {
      throw new Error("A valid public IPv4 address could not be determined");
    }

    return ip;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("IPv4 lookup timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export interface CreateInvestorProfilePayload {
  ipAddress: string;
}

export async function createInvestorProfileAndMfAccount(
  payload: CreateInvestorProfilePayload
): Promise<Record<string, unknown>> {
  const url = `${getApiUrl()}/kyc/investor-profile-and-mf-account`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ipAddress: payload.ipAddress }),
  });

  const data = await response.json().catch(() => null);
  const message =
    (isRecord(data) && typeof data.message === "string"
      ? data.message
      : null) || "Failed to create investor profile. Please try again.";

  if (!response.ok) {
    throw new Error(message);
  }

  return isRecord(data) ? data : {};
}

export interface CreateBankAccountPayload {
  account_number: string;
  type: AccountType;
  ifsc_code: string;
}

export interface CreateBankAccountResult {
  success: boolean;
  verificationStatus: string;
  bankAccountId: number | string;
  message: string;
}

export async function createAndVerifyBankAccount(
  payload: CreateBankAccountPayload
): Promise<CreateBankAccountResult> {
  const url = `${getPaymentApiUrl()}/subscription/createAndVerifyBankAccount`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  const payloadData = isRecord(data) ? data : {};
  const message =
    typeof payloadData.message === "string"
      ? payloadData.message
      : "Failed to verify bank account. Please try again.";

  if (!response.ok) {
    throw new Error(message);
  }

  const bankAccountRecord = isRecord(payloadData.bankAccount)
    ? (payloadData.bankAccount as Record<string, unknown>)
    : null;

  let bankAccountId: string | number = "";
  if (
    bankAccountRecord &&
    (typeof bankAccountRecord.id === "string" ||
      typeof bankAccountRecord.id === "number")
  ) {
    bankAccountId = bankAccountRecord.id;
  } else if (
    typeof payloadData.bankAccountId === "string" ||
    typeof payloadData.bankAccountId === "number"
  ) {
    bankAccountId = payloadData.bankAccountId;
  }

  return {
    success: payloadData.success === true,
    verificationStatus:
      typeof payloadData.verificationStatus === "string"
        ? payloadData.verificationStatus
        : "",
    bankAccountId,
    message,
  };
}
