function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

export interface QuestionAnswerDto {
  questionId?: number;
  option?: string;
  value?: string | number;
  question?: string;
  goalId?: string;
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
