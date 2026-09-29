function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOnboardingApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ONBOARDING_API_URL || "https://onboarding.fydaa.com"
  );
}

function getPaymentApiUrl(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_API_URL || "https://payment.fydaa.com";
}

function getOnboardedUserToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/onboardedUserToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getPartnerAuthToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/authToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export interface QuestionAnswerDto {
  questionId?: number;
  option?: string;
  value?: string | number | boolean;
  question?: string;
  goalId?: string;
}

export interface QuestionDefinition {
  questionId: number;
  question: string;
  option?: Record<string, string | number | boolean>;
}

export interface SubmitPersonalDetailsResponse {
  success: boolean;
  message: string;
}

export interface SubmitFinancialGoalsResponse {
  success: boolean;
  message: string;
}

export interface WealthScoreComponent {
  score: number;
  weight: number;
  weightedScore: number;
  status: string;
  metrics: Record<string, unknown>;
}

export interface WealthScoreInsight {
  priority: string;
  category: string;
  message: string;
  actionable: string;
}

export interface WealthScoreData {
  overallScore: number;
  setuDataUsed?: boolean;
  scoreLabel: string;
  scoreBand: string;
  message: string;
  calculatedAt?: string;
  components: {
    netWorthStrength?: WealthScoreComponent;
    assetQuality?: WealthScoreComponent;
    liquiditySafety?: WealthScoreComponent;
    debtHealth?: WealthScoreComponent;
    goalReadiness?: WealthScoreComponent;
  };
  insights?: WealthScoreInsight[];
}

export interface FinancialPlanData {
  id?: number;
  userId?: number;
  personalDetails?: QuestionAnswerDto[] | null;
  financialGoals?: QuestionAnswerDto[] | Record<string, QuestionAnswerDto[]> | null;
  budgeting?: QuestionAnswerDto[] | null;
  assetsLiabilities?:
    | QuestionAnswerDto[]
    | Record<string, QuestionAnswerDto[]>
    | null;
  insurancePlanning?:
    | QuestionAnswerDto[]
    | Record<string, QuestionAnswerDto[]>
    | null;
  healthScore?: unknown;
  wealthScore?: WealthScoreData | null;
  planPdf?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type FinancialPlanResumePhase =
  | "personalDetails"
  | "financialGoals"
  | "budgeting"
  | "assetsLiabilities"
  | "insurancePlanning"
  | "wealthScore";

function authHeaders(token?: string): Headers {
  const authToken = token || getOnboardedUserToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

function partnerAuthHeaders(): Headers {
  const authToken = getPartnerAuthToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  return headers;
}

function partnerJsonHeaders(): Headers {
  const headers = partnerAuthHeaders();
  headers.set("Content-Type", "application/json");
  return headers;
}

async function postFinancialPlan(
  path: string,
  body: unknown,
  fallbackError: string,
  fallbackSuccess: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}${path}`;
  const headers = authHeaders(token);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string" ? payload.message : fallbackError;
    throw new Error(message);
  }

  return {
    success: payload.success === true,
    message:
      typeof payload.message === "string" ? payload.message : fallbackSuccess,
  };
}

async function postFinancialPlanAnswers(
  path: string,
  answers: QuestionAnswerDto[],
  fallbackError: string,
  fallbackSuccess: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  return postFinancialPlan(path, answers, fallbackError, fallbackSuccess, token);
}

export function isSectionEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>);
    if (entries.length === 0) return true;
    return entries.every((entry) => {
      if (entry == null) return true;
      if (Array.isArray(entry)) return entry.length === 0;
      return false;
    });
  }
  return false;
}

export function resolveFinancialPlanPhase(
  plan: FinancialPlanData | null
): FinancialPlanResumePhase {
  if (!plan || isSectionEmpty(plan.personalDetails)) return "personalDetails";
  if (isSectionEmpty(plan.financialGoals)) return "financialGoals";
  if (isSectionEmpty(plan.budgeting)) return "budgeting";
  if (isSectionEmpty(plan.assetsLiabilities)) return "assetsLiabilities";
  if (isSectionEmpty(plan.insurancePlanning)) return "insurancePlanning";
  return "wealthScore";
}

export function extractHasChildrenFromPersonalDetails(
  personalDetails: QuestionAnswerDto[] | null | undefined
): boolean {
  if (!Array.isArray(personalDetails)) return false;
  return personalDetails.some(
    (answer) => answer.questionId === 5 && answer.option === "1"
  );
}

export async function getFinancialPlan(
  token?: string
): Promise<FinancialPlanData | null> {
  const url = `${getOnboardingApiUrl()}/financial-plan`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to fetch financial plan. Please try again.";
    throw new Error(message);
  }

  if (payload.data == null) return null;
  if (!isRecord(payload.data)) return null;
  return payload.data as FinancialPlanData;
}

export async function submitPersonalDetails(
  answers: QuestionAnswerDto[],
  token?: string
): Promise<SubmitPersonalDetailsResponse> {
  return postFinancialPlanAnswers(
    "/financial-plan/personal-details",
    answers,
    "Failed to submit personal details. Please try again.",
    "Personal details saved successfully",
    token
  );
}

export async function submitFinancialGoals(
  answers: QuestionAnswerDto[],
  token?: string
): Promise<SubmitFinancialGoalsResponse> {
  return postFinancialPlanAnswers(
    "/financial-plan/financial-goals",
    answers,
    "Failed to submit financial goals. Please try again.",
    "Financial goals submitted successfully",
    token
  );
}

export interface SubmitBudgetingResponse {
  success: boolean;
  message: string;
}

export async function submitBudgeting(
  answers: QuestionAnswerDto[],
  token?: string
): Promise<SubmitBudgetingResponse> {
  return postFinancialPlanAnswers(
    "/financial-plan/budgeting",
    answers,
    "Failed to submit budgeting information. Please try again.",
    "Budgeting information submitted successfully",
    token
  );
}

export interface SubmitAssetsLiabilitiesResponse {
  success: boolean;
  message: string;
}

export type AssetsLiabilitiesPayload =
  | QuestionAnswerDto[]
  | Record<string, QuestionAnswerDto[]>;

export async function submitAssetsLiabilities(
  payload: AssetsLiabilitiesPayload,
  token?: string
): Promise<SubmitAssetsLiabilitiesResponse> {
  return postFinancialPlan(
    "/financial-plan/assets-liabilities",
    payload,
    "Failed to submit assets and liabilities. Please try again.",
    "Assets and liabilities submitted successfully",
    token
  );
}

export interface SubmitInsurancePlanningResponse {
  success: boolean;
  message: string;
}

export async function submitInsurancePlanning(
  answers: QuestionAnswerDto[],
  token?: string
): Promise<SubmitInsurancePlanningResponse> {
  return postFinancialPlanAnswers(
    "/financial-plan/insurance-planning",
    answers,
    "Failed to submit insurance planning. Please try again.",
    "Insurance planning submitted successfully",
    token
  );
}

export async function submitInsurancePlanningGroups(
  groups: QuestionAnswerDto[][],
  token?: string
): Promise<SubmitInsurancePlanningResponse> {
  let last: SubmitInsurancePlanningResponse = {
    success: true,
    message: "Insurance planning submitted successfully",
  };

  for (const group of groups) {
    last = await submitInsurancePlanning(group, token);
  }

  return last;
}

export async function calculateWealthScore(
  token?: string
): Promise<WealthScoreData> {
  const url = `${getOnboardingApiUrl()}/financial-plan/wealth-score/calculate`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to calculate wealth score. Please try again.";
    throw new Error(message);
  }

  if (!isRecord(payload.data)) {
    throw new Error("Invalid wealth score response.");
  }

  return payload.data as unknown as WealthScoreData;
}

export async function downloadFinancialPlan(
  token?: string
): Promise<Blob> {
  const url = `${getOnboardingApiUrl()}/financial-plan/download`;
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "Failed to download financial plan. Please try again.";
    throw new Error(message);
  }

  return response.blob();
}

export async function getFinancialPlanForUser(
  userId: string | number
): Promise<FinancialPlanData | null> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: partnerAuthHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to fetch financial plan. Please try again.";
    throw new Error(message);
  }

  if (payload.data == null) return null;
  if (!isRecord(payload.data)) return null;
  return payload.data as FinancialPlanData;
}

export async function getFinancialPlanQuestions(): Promise<
  Record<string, QuestionDefinition[]> | null
> {
  const url = `${getOnboardingApiUrl()}/financial-plan/questions`;
  const response = await fetch(url, {
    method: "GET",
    headers: partnerAuthHeaders(),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to fetch financial plan questions. Please try again.";
    throw new Error(message);
  }

  if (payload.data == null || !isRecord(payload.data)) return null;
  return payload.data as Record<string, QuestionDefinition[]>;
}

export async function updatePersonalDetailsForUser(
  userId: string | number,
  answers: QuestionAnswerDto[]
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/personal-details`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerJsonHeaders(),
    body: JSON.stringify(answers),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to update personal details. Please try again.";
    throw new Error(message);
  }

  return {
    success: payload.success === true,
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Personal details updated successfully",
  };
}

export async function updateFinancialGoalsForUser(
  userId: string | number,
  answers: QuestionAnswerDto[]
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/financial-goals`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerJsonHeaders(),
    body: JSON.stringify(answers),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to update financial goals. Please try again.";
    throw new Error(message);
  }

  return {
    success: payload.success === true,
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Financial goals updated successfully",
  };
}

export async function updateBudgetingForUser(
  userId: string | number,
  answers: QuestionAnswerDto[]
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/budgeting`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerJsonHeaders(),
    body: JSON.stringify(answers),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to update budgeting. Please try again.";
    throw new Error(message);
  }

  return {
    success: payload.success === true,
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Budgeting updated successfully",
  };
}

export async function updateAssetsLiabilitiesForUser(
  userId: string | number,
  payload: AssetsLiabilitiesPayload
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/assets-liabilities`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerJsonHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  const result = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof result.message === "string"
        ? result.message
        : "Failed to update assets and liabilities. Please try again.";
    throw new Error(message);
  }

  return {
    success: result.success === true,
    message:
      typeof result.message === "string"
        ? result.message
        : "Assets and liabilities updated successfully",
  };
}

export async function updateInsurancePlanningForUser(
  userId: string | number,
  answers: QuestionAnswerDto[]
): Promise<{ success: boolean; message: string }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/insurance-planning`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerJsonHeaders(),
    body: JSON.stringify(answers),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to update insurance planning. Please try again.";
    throw new Error(message);
  }

  return {
    success: payload.success === true,
    message:
      typeof payload.message === "string"
        ? payload.message
        : "Insurance planning updated successfully",
  };
}

export async function recalculateWealthScoreForPartner(
  userId: string | number
): Promise<{ success: boolean; message: string; data?: unknown }> {
  const url = `${getOnboardingApiUrl()}/financial-plan/partner/wealth-score/recalculate/${userId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: partnerAuthHeaders(),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Failed to recalculate wealth score. Please try again.";
    throw new Error(message);
  }

  return payload as { success: boolean; message: string; data?: unknown };
}

export async function downloadFinancialPlanForUser(
  userId: string | number
): Promise<Blob> {
  const url = `${getOnboardingApiUrl()}/financial-plan/admin/${userId}/download`;
  const response = await fetch(url, {
    method: "GET",
    headers: partnerAuthHeaders(),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "Failed to download financial plan. Please try again.";
    throw new Error(message);
  }

  return response.blob();
}

const SETU_REDIRECT_FALLBACK = "https://fydaa.com/SuccesspageSetu";

export interface SetuFinancialData {
  bankBalance: number;
  mutualFunds: number;
  stocks: number;
  nps: number;
  fdsRds: number;
  gold: number;
}

export interface SetuConsentResult {
  id: string;
  url: string;
  redirectUrl: string;
}

function paymentAuthHeaders(token: string): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function readResponseMessage(payload: Record<string, unknown>): string | null {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (
    isRecord(payload.error) &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim()
  ) {
    return payload.error.message.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return null;
}

function numericAmount(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function nestedAmount(node: unknown): number {
  if (!isRecord(node)) return 0;
  return numericAmount(node.amount);
}

function resolveSetuDataRoot(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;

  if (isRecord(payload.data)) {
    return payload.data;
  }

  const hasFinancialRoot =
    isRecord(payload.assets) ||
    isRecord(payload.liabilities) ||
    isRecord(payload.income) ||
    isRecord(payload.expenses) ||
    isRecord(payload.cashFlow) ||
    isRecord(payload.netWorth) ||
    "netSavings" in payload;

  return hasFinancialRoot ? payload : null;
}

function extractSetuFinancialData(
  root: Record<string, unknown>
): SetuFinancialData {
  const assets = isRecord(root.assets) ? root.assets : {};
  const cash = isRecord(assets.cashAndCashEquivalents)
    ? assets.cashAndCashEquivalents
    : {};
  const investment = isRecord(assets.investment) ? assets.investment : {};

  return {
    bankBalance: nestedAmount(cash.bankBalance),
    mutualFunds: nestedAmount(investment.mutualFunds),
    stocks: nestedAmount(investment.stocks),
    nps: nestedAmount(investment.retirement),
    fdsRds: nestedAmount(investment.fdsRds),
    gold: nestedAmount(investment.gold),
  };
}

export async function fetchSetuFinancialData(
  token: string
): Promise<SetuFinancialData | null> {
  try {
    const url = `${getPaymentApiUrl()}/setu/sebi-data/last-month`;
    const response = await fetch(url, {
      method: "GET",
      headers: paymentAuthHeaders(token),
    });

    if (!response.ok) return null;

    const data = await response.json().catch(() => null);
    const root = resolveSetuDataRoot(data);
    if (!root) return null;

    return extractSetuFinancialData(root);
  } catch (error) {
    console.warn("Failed to fetch Setu financial data:", error);
    return null;
  }
}

export async function createSetuConsent(
  token: string,
  fiTypes: string[]
): Promise<SetuConsentResult | null> {
  const url = `${getPaymentApiUrl()}/setu/consent`;
  const response = await fetch(url, {
    method: "POST",
    headers: paymentAuthHeaders(token),
    body: JSON.stringify({ fiTypes }),
  });

  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  if (!response.ok) {
    const message =
      readResponseMessage(payload) ||
      "Failed to start Account Aggregator consent. Please try again.";
    throw new Error(message);
  }

  const consentUrl = typeof payload.url === "string" ? payload.url.trim() : "";
  if (!consentUrl) return null;

  const id = typeof payload.id === "string" ? payload.id : "";
  const redirectUrl =
    typeof payload.redirectUrl === "string" ? payload.redirectUrl.trim() : "";

  return {
    id,
    url: consentUrl,
    redirectUrl: redirectUrl || SETU_REDIRECT_FALLBACK,
  };
}

function readConsentStatus(payload: Record<string, unknown>): string | null {
  if (typeof payload.status === "string" && payload.status.trim()) {
    return payload.status.trim();
  }
  if (typeof payload.consentStatus === "string" && payload.consentStatus.trim()) {
    return payload.consentStatus.trim();
  }
  if (isRecord(payload.data)) {
    return readConsentStatus(payload.data);
  }
  return null;
}

async function requestSetuConsent(
  token: string,
  consentId: string
): Promise<{ ok: boolean; status: string | null; message: string | null }> {
  const url = `${getPaymentApiUrl()}/setu/consent/${encodeURIComponent(consentId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: paymentAuthHeaders(token),
  });
  const data = await response.json().catch(() => null);
  const payload = isRecord(data) ? data : {};

  return {
    ok: response.ok,
    status: readConsentStatus(payload),
    message: readResponseMessage(payload),
  };
}

export async function getSetuConsentStatus(
  token: string,
  consentId: string
): Promise<string | null> {
  if (!consentId.trim()) return null;

  try {
    const result = await requestSetuConsent(token, consentId);
    if (!result.ok) return null;
    return result.status;
  } catch {
    return null;
  }
}

export async function captureSetuConsent(
  token: string,
  consentId: string
): Promise<void> {
  if (!consentId.trim()) return;

  try {
    const result = await requestSetuConsent(token, consentId);
    if (!result.ok) {
      console.warn(
        result.message || "Setu consent capture failed."
      );
    }
  } catch (error) {
    console.warn("Setu consent capture failed:", error);
  }
}
