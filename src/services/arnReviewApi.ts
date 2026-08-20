type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function getStockApiUrl(): string {
  return process.env.NEXT_PUBLIC_STOCK_API_URL || "";
}

function getAuthApiUrl(): string {
  return process.env.NEXT_PUBLIC_AUTHENTICATION_API_URL || "";
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (typeof document !== "undefined") {
    const match = document.cookie.match(/authToken=([^;]+)/);
    const authToken = match ? decodeURIComponent(match[1]) : "";
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
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

export interface UserStageResponse {
  isSubscribed: boolean;
  isSubscriptionExpiringSoon: boolean;
  isSubscriptionExpired: boolean;
  isNewSmallcaseSubscribed: boolean;
  isRiskProfileComplete: boolean;
  isPinCreated: boolean;
  hadLegacyPin: boolean;
  hasLegacyV1Pin: boolean;
  pinSetupType: string;
  isFirstInvestmentComplete: boolean;
  isOrderAMO: boolean;
  isFirstUsStockInvestmentComplete: boolean;
  subscriptionExpiryDaysLeft: number | null;
  kycExtraData: boolean;
  isNonCompliantData: boolean;
  isMaxSipAutopay: boolean;
  isKiteSessionExpired: boolean;
  isKiteUser: boolean;
  isKiteRebalanceComplete: boolean;
  isEmandate: boolean;
  isAddressId: boolean;
  isEmailId: boolean;
  isPhoneId: boolean;
  isInvestorProfileId: boolean;
  isMfiaId: boolean;
  isEmail: boolean;
  isUSstock: number;
  isInvestmentModelSelected: boolean;
  investmentModel: string;
  isKycCompliant: boolean;
  isKycNonCompliant: boolean;
  isNominee: boolean;
  isDigiLocker: boolean;
  isNSDL: boolean;
  isPan: boolean;
  isDob: boolean;
  isBank: boolean;
  isMfMandate: boolean;
  mandateAmount: number;
  isCompliant: boolean;
  isPackage: boolean;
  packageName: string;
  isKycExpired: boolean;
  isRepair: boolean;
  isEmployee: boolean;
  isSetuConsent: boolean;
  isLumpsum: boolean;
  lumpsumId: number | null;
  isSavingGoal: boolean;
  indianStockPortfolioId: number;
  usStockPortfolioId: number | null;
  isFinancialPlanComplete: boolean;
  isHealthCheckUpComplete: boolean;
  isDebtPlanComplete: boolean;
  ismodify: boolean;
  ismodifydigilocker: boolean;
  ismodifyquestions: boolean;
  ismodifyesign: boolean;
  ismodifynsdl: boolean;
  profileStage: Array<{
    type: string;
    completed: boolean;
    details: Record<string, unknown>;
  }>;
}

export interface KycCheckResponse {
  status: boolean;
  reason: string | null;
  readiness?: {
    status: string | null;
    code: string | null;
    reason: string | null;
  };
  pan?: {
    status: string | null;
    code: string | null;
    reason: string | null;
  };
  name?: {
    status: string | null;
    code: string | null;
    reason: string | null;
  };
  date_of_birth?: {
    status: string | null;
    code: string | null;
    reason: string | null;
  };
  bank_accounts?: Array<{
    status: string | null;
    code: string | null;
    reason: string | null;
  }>;
}

export interface SipSetupPayload {
  goalId: number;
  sipAmount: string;
  sipName: string;
  goalAmount: string;
  autoRenewDate: string;
  startDate: string;
  endDate: string;
  status: "INACTIVE";
  sipTenure: string;
  sipFrequency: "daily" | "monthly";
  sipDate?: string;
  selectedScheme?: string | null;
  selectedMfId?: number | null;
}

export interface SipSetupResponse {
  sipData: {
    id: number;
    portfolioId?: number;
  };
  portfolioId?: number;
}

export interface BuyOrderMfResponse {
  orders?: Array<{
    isin: string;
    quantity: string;
    price: string;
    orderValue: string;
  }>;
  data?: {
    orders?: Array<{
      isin: string;
      quantity: string;
      price: string;
      orderValue: string;
    }>;
  };
}

export interface CompleteMandateRequest {
  user_ip: string;
  sipId: number;
  orders: Array<{
    isin: string;
    quantity: string;
    price: string;
    orderValue: string;
  }>;
}

function getPayApiUrl(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_API_URL || "";
}

export interface SetupMandateResponse {
  mandateId: number;
  authorizationUrl: string;
  paymentId: number;
  message: string;
}

export interface UpdateMfiaResponse {
  object: string;
  id: string;
  old_id: number;
  primary_investor_pan: string;
  second_investor_pan: string | null;
  third_investor_pan: string | null;
  primary_investor: string;
  second_investor: string | null;
  third_investor: string | null;
  primary_investor_old_id: number | null;
  second_investor_old_id: number | null;
  third_investor_old_id: number | null;
  holding_pattern: string;
  created_at: string;
  folio_defaults: {
    communication_email_address: string;
    communication_mobile_number: string;
    communication_address: string;
    overseas_communication_address: string | null;
    payout_bank_account: string;
    nominee1: string | null;
    nominee1_allocation_percentage: number | null;
    nominee1_identity_proof_type: string | null;
    nominee1_guardian_identity_proof_type: string | null;
    nominee2: string | null;
    nominee2_allocation_percentage: number | null;
    nominee2_identity_proof_type: string | null;
    nominee2_guardian_identity_proof_type: string | null;
    nominee3: string | null;
    nominee3_allocation_percentage: number | null;
    nominee3_identity_proof_type: string | null;
    nominee3_guardian_identity_proof_type: string | null;
    demat_account: string | null;
    nominations_info_visibility: string;
  };
}

export async function setupMandateForUser(
  userId: number,
  mandateType: string,
  mandateLimit: number,
  postbackUrl?: string
): Promise<SetupMandateResponse> {
  const url = `${getPayApiUrl()}/subscription/createAndAuthorizeMandate-for-user`;
  return fetchJson<SetupMandateResponse>(url, {
    method: "POST",
    body: JSON.stringify({
      userId,
      mandate_type: mandateType,
      mandate_limit: mandateLimit,
      paymentPostbackUrl: postbackUrl,
    }),
  });
}

export async function getMandateForUser(mandateId: number, userId: number): Promise<Record<string, unknown>> {
  const url = `${getPayApiUrl()}/subscription/mandate/for-user/${mandateId}?userId=${userId}`;
  return fetchJson(url, { method: "GET" });
}

export async function updateMfiaForUser(userId: number): Promise<UpdateMfiaResponse> {
  const url = `${getPayApiUrl()}/subscription/update-mfia-for-user`;
  return fetchJson<UpdateMfiaResponse>(url, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
}

export async function sendConsentOtpForUser(userId: number): Promise<void> {
  const url = `${getStockApiUrl()}/mutualFund/consentOtp-for-user`;
  await fetchJson(url, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function verifyConsentOtpForUser(userId: number, otp: string): Promise<void> {
  const url = `${getStockApiUrl()}/mutualFund/verifyOtp-for-user`;
  await fetchJson(url, {
    method: "POST",
    body: JSON.stringify({ userId, otp }),
  });
}

export async function createSipSetupForUser(
  userId: number,
  payload: SipSetupPayload
): Promise<SipSetupResponse> {
  const url = `${getStockApiUrl()}/orders/sipSetup-for-user`;
  return fetchJson<SipSetupResponse>(url, {
    method: "POST",
    body: JSON.stringify({ ...payload, userId }),
  });
}

export async function getBuyOrderMfForUser(
  userId: number,
  sipId: number,
  minimumAmount: number
): Promise<BuyOrderMfResponse> {
  const url = `${getStockApiUrl()}/stock/buyOrderMf-for-user?sipId=${sipId}&minimumAmount=${minimumAmount}&userId=${userId}`;
  return fetchJson<BuyOrderMfResponse>(url, { method: "GET" });
}

export interface CompleteMandateResponse {
  planIds: string[];
  totalCreated: number;
  totalFailed: number;
  totalPlansCreated: number;
  partialSuccess: boolean;
  readyForActivation: boolean;
  mandateId: number;
  results: Array<{
    scheme: string;
    success: boolean;
    error?: string;
  }>;
}

export async function completeWithMandateFirstDebitForUser(
  userId: number,
  sipId: number,
  orders: CompleteMandateRequest["orders"],
  userIp: string
): Promise<CompleteMandateResponse> {
  const url = `${getStockApiUrl()}/mutualFund/mf-purchase-plan/orders/flow/complete-with-mandate-first-debit-for-user`;
  return fetchJson<CompleteMandateResponse>(url, {
    method: "POST",
    body: JSON.stringify({
      userId,
      user_ip: userIp,
      sipId,
      orders,
    }),
  });
}

export async function getMySipMfForUser(userId: number) {
  const url = `${getStockApiUrl()}/orders/getMySipMf-for-user?userId=${userId}`;
  return fetchJson(url);
}

export async function getUserStage(
  userId: number,
  goalId: number,
  assetType = "MUTUALFUND"
): Promise<UserStageResponse> {
  const url = `${getAuthApiUrl()}/user/getUserStageForUser?userId=${userId}&goalId=${goalId}&assetType=${assetType}`;
  return fetchJson<UserStageResponse>(url);
}

export async function checkKycForUser(userId: number): Promise<KycCheckResponse> {
  const url = `${getAuthApiUrl()}/kyc/check-kyc-for-user?userId=${userId}`;
  return fetchJson<KycCheckResponse>(url, { method: "POST" });
}

export async function sendConsentOtp(): Promise<void> {
  const url = `${getStockApiUrl()}/mutualFund/consentOtp`;
  await fetchJson(url, { method: "POST" });
}

export async function verifyConsentOtp(otp: string): Promise<void> {
  const url = `${getStockApiUrl()}/mutualFund/verifyOtp`;
  await fetchJson(url, {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export async function createSipSetup(
  payload: SipSetupPayload
): Promise<SipSetupResponse> {
  const url = `${getStockApiUrl()}/orders/sipSetup`;
  return fetchJson<SipSetupResponse>(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBuyOrderMf(
  sipId: number,
  minimumAmount: number
): Promise<BuyOrderMfResponse> {
  const url = `${getStockApiUrl()}/stock/buyOrderMf?sipId=${sipId}&minimumAmount=${minimumAmount}`;
  return fetchJson<BuyOrderMfResponse>(url, { method: "GET" });
}

export async function completeWithMandateFirstDebit(
  sipId: number,
  orders: CompleteMandateRequest["orders"],
  userIp: string
): Promise<CompleteMandateResponse> {
  const url = `${getStockApiUrl()}/mutualFund/mf-purchase-plan/orders/flow/complete-with-mandate-first-debit`;
  return fetchJson<CompleteMandateResponse>(url, {
    method: "POST",
    body: JSON.stringify({
      user_ip: userIp,
      sipId,
      orders,
    }),
  });
}
