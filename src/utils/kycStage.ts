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
 * - Modify complete → allow (even if `isKycCompliant` lags)
 * - Otherwise require `isKycCompliant` and not expired
 *
 * Also call `POST /kyc/check-kyc`: `action: "modify"` blocks even when stage looks ready.
 */
export function isKycReadyToProceed(stage: KycStageFlags): boolean {
  if (stage.isKycExpired === true) return false;
  if (needsKycModify(stage)) return false;
  if (isModifyKycComplete(stage)) return true;
  return stage.isKycCompliant === true;
}

/** check-kyc / fetch-kyc: status true with action modify is still not compliant. */
export function checkKycRequiresModify(check: {
  action?: string | null;
}): boolean {
  return check.action === "modify";
}
