/** Minimal stage shape used to decide whether KYC can proceed past verification. */
export interface KycStageFlags {
  isKycCompliant?: boolean;
  isKycNonCompliant?: boolean;
  isKycExpired?: boolean;
  isPan?: boolean;
  isDob?: boolean;
  kycExtraData?: boolean;
  isNonCompliantData?: boolean;
  isDigiLocker?: boolean;
  isNSDL?: boolean;
  ismodify?: boolean;
  ismodifydigilocker?: boolean;
  ismodifyquestions?: boolean;
  ismodifyesign?: boolean;
  ismodifynsdl?: boolean;
}

/**
 * Modify KYC is still in progress when a modify form exists but NSDL submit is not done.
 * Per modify-kyc-flow.md: `ismodify == true AND ismodifynsdl != true`
 *
 * Do not use leftover isNSDL / isDigiLocker / kycExtraData for this.
 */
export function needsKycModify(stage: KycStageFlags): boolean {
  return stage.ismodify === true && stage.ismodifynsdl !== true;
}

/** In-app Modify KYC finished (form submitted to NSDL/KRA). */
export function isModifyKycComplete(stage: KycStageFlags): boolean {
  return stage.ismodify === true && stage.ismodifynsdl === true;
}

/**
 * True when onboard may proceed past the KYC verification gate.
 * - Incomplete modify (`ismodify` without `ismodifynsdl`) → block
 * - Modify complete (`ismodify` + `ismodifynsdl`) → allow
 * - Otherwise require `isKycCompliant` and not expired
 *
 * Never treat bare `isKycCompliant` as enough while a modify form is open.
 * Also call `POST /kyc/check-kyc`: `action: "modify"` blocks even when stage looks ready.
 */
export function isKycReadyToProceed(stage: KycStageFlags): boolean {
  if (stage.isKycExpired === true) return false;
  if (needsKycModify(stage)) return false;
  // Open modify form that is not finished must never look "compliant"
  if (stage.ismodify === true) {
    return stage.ismodifynsdl === true;
  }
  return stage.isKycCompliant === true;
}

/** check-kyc / fetch-kyc: status true with action modify is still not compliant. */
export function checkKycRequiresModify(check: {
  action?: string | null;
}): boolean {
  return check.action === "modify";
}

export function normalizeKycReason(reason: string | null | undefined): string {
  return (reason ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

const UNDER_PROCESS_REASONS = new Set([
  "underprocess",
  "under_process",
  "inprogress",
  "in_process",
]);

export function isUnderProcessReason(reason: string | null | undefined): boolean {
  return UNDER_PROCESS_REASONS.has(normalizeKycReason(reason));
}

export const NO_RECORD_CODES = new Set([
  "not_found",
  "no_record",
  "kyc_not_found",
]);

export function isNoRecordCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = normalizeKycReason(code);
  return (
    NO_RECORD_CODES.has(normalized) ||
    Array.from(NO_RECORD_CODES).some((item) => normalized.includes(item))
  );
}

/** BE check-kyc 400 when the user profile has no PAN yet — not a KRA no-record. */
export function isPanMissingOnProfile(text: string | null | undefined): boolean {
  const value = (text ?? "").toLowerCase();
  if (!value) return false;
  return (
    (value.includes("pan not found") && value.includes("profile")) ||
    value.includes("please add pan first")
  );
}

/**
 * KRA has no usable KYC record (fresh KYC). Do not treat "PAN not found on
 * user profile" as this — that means save PAN first.
 */
export function isNoRecordText(text: string | null | undefined): boolean {
  const value = (text ?? "").toLowerCase();
  if (!value) return false;
  if (isPanMissingOnProfile(value)) return false;
  return (
    value.includes("kyc record not found") ||
    value.includes("kyc not found") ||
    value.includes("no kyc record") ||
    value.includes("no record") ||
    value.includes("fresh kyc") ||
    (value.includes("not found") && value.includes("kyc"))
  );
}

/**
 * Non-compliant DigiLocker/NSDL path is still open. Leftover isKycCompliant /
 * kycExtraData from an older KYC must not skip this.
 */
export function isNonCompliantInProgress(stage: KycStageFlags): boolean {
  if (stage.isKycExpired === true) return false;
  if (stage.ismodify === true && stage.ismodifynsdl !== true) return false;
  if (stage.isKycNonCompliant === true && stage.isNSDL !== true) return true;
  if (stage.isKycCompliant === true) return false;
  if (stage.ismodify === true) return false;
  return stage.isNonCompliantData === true || stage.isDigiLocker === true;
}

export interface KycMismatchInput {
  action?: string | null;
  reason?: string | null;
  message?: string | null;
  issues?: Array<{ code?: string; reason?: string }>;
  recommendations?: string[];
  verificationStatus?: Record<string, unknown> | null;
}

export function detectKycMismatch(result: KycMismatchInput): boolean {
  if (result.action === "correction_required") return true;

  const verification = result.verificationStatus ?? {};
  if (verification.name === "failed" && verification.nameCode === "mismatch") {
    return true;
  }
  if (verification.dob === "failed" && verification.dobCode === "mismatch") {
    return true;
  }
  if (
    verification.pan === "failed" &&
    verification.panCode != null &&
    String(verification.panCode).trim() !== ""
  ) {
    return true;
  }

  const issues = result.issues ?? [];
  if (issues.some((issue) => issue.code && !isNoRecordCode(issue.code))) {
    return true;
  }

  const haystack = `${result.message ?? ""} ${result.reason ?? ""}`.toLowerCase();
  return (
    haystack.includes("does not match") ||
    haystack.includes("name mismatch") ||
    haystack.includes("dob mismatch") ||
    haystack.includes("correction required")
  );
}

export function formatKycIssues(result: KycMismatchInput): string {
  const issueReasons = (result.issues ?? [])
    .map((issue) => issue.reason?.trim())
    .filter((reason): reason is string => Boolean(reason));
  if (issueReasons.length) return issueReasons.join(". ");
  if (result.reason?.trim()) return result.reason.trim();
  const recommendations = (result.recommendations ?? []).filter((item) =>
    item.trim()
  );
  if (recommendations.length) return recommendations.join(". ");
  if (result.message?.trim()) return result.message.trim();
  return "Please correct your PAN details and try again.";
}

const KYC_NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export function toTitleCaseName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
}

export function validateKycFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter the full name.";
  if (/\s{2,}/.test(trimmed)) {
    return "Use a single space between name parts.";
  }
  if (!KYC_NAME_PATTERN.test(trimmed)) {
    return "Name can contain letters and single spaces only.";
  }
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) {
    return "Name must contain at least 2 letters.";
  }
  return null;
}

export function isModifyUnderReview(stage: KycStageFlags): boolean {
  return (
    stage.ismodify === true &&
    stage.ismodifydigilocker === true &&
    stage.ismodifyquestions === true &&
    stage.ismodifyesign === true &&
    stage.ismodifynsdl === true &&
    stage.isKycCompliant !== true
  );
}
