"use client";

import { useEffect, useState } from "react";
import PersonalDetailsForm from "./PersonalDetailsForm";
import FinancialGoalsForm from "./FinancialGoalsForm";
import BudgetingForm from "./BudgetingForm";
import AssetsLiabilitiesForm from "./AssetsLiabilitiesForm";
import InsurancePlanningForm from "./InsurancePlanningForm";
import WealthScoreView from "./WealthScoreView";
import type {
  AssetsLiabilitiesPayload,
  QuestionAnswerDto,
  WealthScoreData,
} from "@/services/financialPlanService";

interface FinancialPlanFormProps {
  phase:
    | "mobile"
    | "otp"
    | "verified"
    | "personalDetails"
    | "financialGoals"
    | "budgeting"
    | "assetsLiabilities"
    | "insurancePlanning"
    | "wealthScore";
  mobile: string;
  onMobileChange: (value: string) => void;
  otpValues: string[];
  onOtpChange: (values: string[]) => void;
  onGoToMobile: () => void;
  onMobileSubmit: () => void;
  onVerify: () => void;
  onResend: () => void;
  isMobileValid: boolean;
  isOtpComplete: boolean;
  isRequesting: boolean;
  isVerifying: boolean;
  isResending: boolean;
  otpError: string | null;
  formattedMobile: string;
  onBackToVerified: () => void;
  onPersonalDetailsSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmittingPersonalDetails: boolean;
  personalDetailsError: string | null;
  onContinueFromVerified: () => void;
  onBackToPersonalDetails: () => void;
  onFinancialGoalsSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmittingFinancialGoals: boolean;
  financialGoalsError: string | null;
  hasChildren: boolean;
  onBackToFinancialGoals: () => void;
  onBudgetingSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmittingBudgeting: boolean;
  budgetingError: string | null;
  onBackToBudgeting: () => void;
  onAssetsLiabilitiesSubmit: (payload: AssetsLiabilitiesPayload) => Promise<void>;
  isSubmittingAssetsLiabilities: boolean;
  assetsLiabilitiesError: string | null;
  onBackToAssetsLiabilities: () => void;
  onInsurancePlanningSubmit: (groups: QuestionAnswerDto[][]) => Promise<void>;
  isSubmittingInsurancePlanning: boolean;
  insurancePlanningError: string | null;
  wealthScore: WealthScoreData | null;
  isLoadingWealthScore: boolean;
  wealthScoreError: string | null;
  onRetryWealthScore: () => void;
  onDownloadPlan: () => void;
  isDownloadingPlan: boolean;
  downloadError: string | null;
}

export default function FinancialPlanForm({
  phase,
  mobile,
  onMobileChange,
  otpValues,
  onOtpChange,
  onGoToMobile,
  onMobileSubmit,
  onVerify,
  onResend,
  isMobileValid,
  isOtpComplete,
  isRequesting,
  isVerifying,
  isResending,
  otpError,
  formattedMobile,
  onBackToVerified,
  onPersonalDetailsSubmit,
  isSubmittingPersonalDetails,
  personalDetailsError,
  onContinueFromVerified,
  onBackToPersonalDetails,
  onFinancialGoalsSubmit,
  isSubmittingFinancialGoals,
  financialGoalsError,
  hasChildren,
  onBackToFinancialGoals,
  onBudgetingSubmit,
  isSubmittingBudgeting,
  budgetingError,
  onBackToBudgeting,
  onAssetsLiabilitiesSubmit,
  isSubmittingAssetsLiabilities,
  assetsLiabilitiesError,
  onBackToAssetsLiabilities,
  onInsurancePlanningSubmit,
  isSubmittingInsurancePlanning,
  insurancePlanningError,
  wealthScore,
  isLoadingWealthScore,
  wealthScoreError,
  onRetryWealthScore,
  onDownloadPlan,
  isDownloadingPlan,
  downloadError,
}: FinancialPlanFormProps) {
  const [resendTimerState, setResendTimerState] = useState(30);

  useEffect(() => {
    if (phase === "otp") {
      setResendTimerState(30);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "otp" || resendTimerState <= 0) return;
    const timer = setInterval(() => {
      setResendTimerState((t) => (t <= 1 ? (clearInterval(timer), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, resendTimerState]);

  return (
    <div>
      {phase === "mobile" && (
        <div className="step-panel">
          <div className="text-center">
            <p className="step-eyebrow">Financial Plan</p>
            <h2 className="step-title">Enter user&apos;s mobile number</h2>
            <p className="step-helper">We will send a one-time code to this number for verification.</p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Mobile Number <span className="req">Required</span>
            </label>
            <div className="flex gap-2">
              <div className="field-prefix field-prefix-fixed flex items-center justify-center gap-1 min-w-[88px]">
                <span>🇮🇳 +91</span>
              </div>
              <input
                className="field-input flex-1"
                placeholder="98765 43210"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>

          {otpError && phase === "mobile" && (
            <div className="field-error">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <button
            type="button"
            onClick={onMobileSubmit}
            disabled={!isMobileValid || isRequesting}
            className="btn-primary btn-wide"
          >
            {isRequesting ? "Sending..." : "Proceed"} {!isRequesting && <i className="ti ti-arrow-right" aria-hidden="true" />}
          </button>
        </div>
      )}

      {phase === "otp" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToMobile} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Financial Plan</p>
            <h2 className="step-title">Enter the OTP sent to</h2>
            <p className="step-helper">{formattedMobile}</p>
          </div>

          <div className="otp-row justify-center">
            {otpValues.map((value, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => {
                  const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otpValues];
                  next[index] = digit;
                  onOtpChange(next);
                  if (digit && index < otpValues.length - 1) {
                    const el = document.getElementById(`otp-${index + 1}`);
                    el?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpValues[index] && index > 0) {
                    const el = document.getElementById(`otp-${index - 1}`);
                    el?.focus();
                  }
                }}
              />
            ))}
          </div>

          {otpError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <div className="mb-5 text-center">
            <span
              className={`resend-link ${resendTimerState > 0 || isResending ? "disabled" : ""}`}
              role="button"
              onClick={onResend}
            >
              {isResending ? "Resending..." : resendTimerState > 0 ? `Resend OTP in ${resendTimerState}s` : "Resend OTP"}
            </span>
          </div>

          <button
            type="button"
            onClick={onVerify}
            disabled={!isOtpComplete || isVerifying}
            className="btn-primary btn-wide"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "verified" && (
        <div className="step-panel">
          <p className="step-eyebrow" style={{ textAlign: "center" }}>
            Financial Plan
          </p>
          <h2 className="step-title" style={{ textAlign: "center" }}>
            Mobile Verified Successfully
          </h2>
          <p className="step-helper" style={{ textAlign: "center" }}>
            OTP verification completed. Continue to personal details.
          </p>

          <div className="glass-card rounded-[10px] border border-[var(--arn-amber)] bg-[var(--arn-amber-sel-bg)]" style={{ textAlign: "center", padding: "34px 26px" }}>
            <div className="success-ring brand">
              <i className="ti ti-shield-check" aria-hidden="true" />
            </div>
            <div className="card-title" style={{ textAlign: "center" }}>
              Verified!
            </div>
            <div className="card-sub" style={{ textAlign: "center" }}>
              Mobile number verified successfully.
            </div>
          </div>

          <button
            type="button"
            onClick={onContinueFromVerified}
            className="btn-primary btn-wide"
            style={{ marginTop: 24 }}
          >
            Continue <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}

      {phase === "personalDetails" && (
        <PersonalDetailsForm
          onBack={onBackToVerified}
          onSubmit={onPersonalDetailsSubmit}
          isSubmitting={isSubmittingPersonalDetails}
          error={personalDetailsError}
        />
      )}

      {phase === "financialGoals" && (
        <FinancialGoalsForm
          onBack={onBackToPersonalDetails}
          onSubmit={onFinancialGoalsSubmit}
          isSubmitting={isSubmittingFinancialGoals}
          error={financialGoalsError}
          hasChildren={hasChildren}
        />
      )}

      {phase === "budgeting" && (
        <BudgetingForm
          onBack={onBackToFinancialGoals}
          onSubmit={onBudgetingSubmit}
          isSubmitting={isSubmittingBudgeting}
          error={budgetingError}
        />
      )}

      {phase === "assetsLiabilities" && (
        <AssetsLiabilitiesForm
          onBack={onBackToBudgeting}
          onSubmit={onAssetsLiabilitiesSubmit}
          isSubmitting={isSubmittingAssetsLiabilities}
          error={assetsLiabilitiesError}
        />
      )}

      {phase === "insurancePlanning" && (
        <InsurancePlanningForm
          onBack={onBackToAssetsLiabilities}
          onSubmit={onInsurancePlanningSubmit}
          isSubmitting={isSubmittingInsurancePlanning}
          error={insurancePlanningError}
        />
      )}

      {phase === "wealthScore" && (
        <WealthScoreView
          data={
            wealthScore ?? {
              overallScore: 0,
              scoreLabel: "",
              scoreBand: "",
              message: "",
              components: {},
            }
          }
          isLoading={isLoadingWealthScore || (!wealthScore && !wealthScoreError)}
          error={wealthScoreError || downloadError}
          onRetry={onRetryWealthScore}
          onDownload={onDownloadPlan}
          isDownloading={isDownloadingPlan}
        />
      )}
    </div>
  );
}
