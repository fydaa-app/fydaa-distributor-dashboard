/** Minimal stage shape used to decide whether KYC can proceed past verification. */
export interface KycStageFlags {
  isKycCompliant?: boolean;
  isKycNonCompliant?: boolean;
  isKycExpired?: boolean;
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
