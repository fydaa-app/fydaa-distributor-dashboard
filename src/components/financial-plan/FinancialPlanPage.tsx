"use client";

import { getCookie, setCookie } from "cookies-next";
import { useState } from "react";
import FinancialPlanForm from "./FinancialPlanForm";
import { requestArnOtp, verifyArnOtp } from "@/services/arnOnboardService";
import {
  calculateWealthScore,
  downloadFinancialPlan,
  extractHasChildrenFromPersonalDetails,
  getFinancialPlan,
  resolveFinancialPlanPhase,
  submitAssetsLiabilities,
  submitBudgeting,
  submitFinancialGoals,
  submitInsurancePlanningGroups,
  submitPersonalDetails,
  type AssetsLiabilitiesPayload,
  type QuestionAnswerDto,
  type WealthScoreData,
} from "@/services/financialPlanService";

type Phase =
  | "mobile"
  | "otp"
  | "verified"
  | "personalDetails"
  | "financialGoals"
  | "budgeting"
  | "assetsLiabilities"
  | "insurancePlanning"
  | "wealthScore";

export default function FinancialPlanPage() {
  const [phase, setPhase] = useState<Phase>("mobile");
  const [mobile, setMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      const sessionMobile = sessionStorage.getItem("arn_onboard_mobile");
      if (sessionMobile) {
        sessionStorage.removeItem("arn_onboard_mobile");
        return sessionMobile.replace(/\D/g, '').slice(0, 10);
      }
      const params = new URLSearchParams(window.location.search);
      return (params.get('mobile') || '').replace(/\D/g, '').slice(0, 10);
    }
    return '';
  });
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmittingPersonalDetails, setIsSubmittingPersonalDetails] = useState(false);
  const [personalDetailsError, setPersonalDetailsError] = useState<string | null>(null);
  const [isSubmittingFinancialGoals, setIsSubmittingFinancialGoals] = useState(false);
  const [financialGoalsError, setFinancialGoalsError] = useState<string | null>(null);
  const [isSubmittingBudgeting, setIsSubmittingBudgeting] = useState(false);
  const [budgetingError, setBudgetingError] = useState<string | null>(null);
  const [isSubmittingAssetsLiabilities, setIsSubmittingAssetsLiabilities] = useState(false);
  const [assetsLiabilitiesError, setAssetsLiabilitiesError] = useState<string | null>(null);
  const [isSubmittingInsurancePlanning, setIsSubmittingInsurancePlanning] = useState(false);
  const [insurancePlanningError, setInsurancePlanningError] = useState<string | null>(null);
  const [hasChildren, setHasChildren] = useState(false);
  const [wealthScore, setWealthScore] = useState<WealthScoreData | null>(null);
  const [isLoadingWealthScore, setIsLoadingWealthScore] = useState(false);
  const [wealthScoreError, setWealthScoreError] = useState<string | null>(null);
  const [isDownloadingPlan, setIsDownloadingPlan] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const rawUserData = getCookie("userData");
  const userData = rawUserData ? JSON.parse(rawUserData as string) : {};
  const rawEmployeeData = getCookie("employeeData");
  const employeeData = rawEmployeeData ? JSON.parse(rawEmployeeData as string) : {};
  const referredBy = employeeData?.referralCode || userData?.code || "";

  const goToOtp = () => setPhase("otp");
  const goToMobile = () => setPhase("mobile");

  const loadWealthScore = async (token?: string, forceCalculate = false) => {
    setPhase("wealthScore");
    setIsLoadingWealthScore(true);
    setWealthScoreError(null);

    try {
      if (!forceCalculate) {
        const plan = await getFinancialPlan(token);
        if (plan?.wealthScore && typeof plan.wealthScore.overallScore === "number") {
          setWealthScore(plan.wealthScore);
          return;
        }
      }

      const score = await calculateWealthScore(token);
      setWealthScore(score);
    } catch (err) {
      setWealthScoreError(
        err instanceof Error
          ? err.message
          : "Failed to calculate wealth score. Please try again."
      );
    } finally {
      setIsLoadingWealthScore(false);
    }
  };

  const handleDownloadPlan = async () => {
    if (isDownloadingPlan) return;

    setIsDownloadingPlan(true);
    setDownloadError(null);

    try {
      const blob = await downloadFinancialPlan();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "financial-plan.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Failed to download financial plan. Please try again."
      );
    } finally {
      setIsDownloadingPlan(false);
    }
  };

  const resumeFromExistingPlan = async (token?: string) => {
    try {
      const plan = await getFinancialPlan(token);
      setHasChildren(extractHasChildrenFromPersonalDetails(plan?.personalDetails));

      const nextPhase = resolveFinancialPlanPhase(plan);
      if (nextPhase === "wealthScore") {
        if (plan?.wealthScore && typeof plan.wealthScore.overallScore === "number") {
          setWealthScore(plan.wealthScore);
          setPhase("wealthScore");
        } else {
          await loadWealthScore(token, true);
        }
        return;
      }

      setPhase(nextPhase);
    } catch {
      setPhase("personalDetails");
    }
  };

  const handleMobileSubmit = async () => {
    if (mobile.replace(/\D/g, "").length !== 10) return;

    setIsRequesting(true);
    setOtpError(null);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy,
      });
      goToOtp();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (!otpValues.every((v) => v.length === 1)) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const digits = otpValues.join("");
      const result = await verifyArnOtp({
        mobileNumber: mobile.replace(/\D/g, ""),
        otp: digits,
      });

      const userData = (result.data || {}) as Record<string, unknown>;
      const accessToken =
        userData.accessToken && typeof userData.accessToken === "string"
          ? userData.accessToken
          : undefined;

      if (accessToken) {
        setCookie("onboardedUserToken", accessToken, { path: "/" });
      }
      if (userData.refreshToken && typeof userData.refreshToken === "string") {
        setCookie("onboardedUserRefreshToken", userData.refreshToken, { path: "/" });
      }
      setCookie("onboardedUserData", JSON.stringify(userData), { path: "/" });

      await resumeFromExistingPlan(accessToken);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "OTP verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    setOtpError(null);
    setIsResending(true);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: "+91",
        mobileNumber: digits,
        referredBy,
      });
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handlePersonalDetailsSubmit = async (answers: QuestionAnswerDto[]) => {
    setIsSubmittingPersonalDetails(true);
    setPersonalDetailsError(null);

    try {
      await submitPersonalDetails(answers);
      const answeredHasChildren = answers.some(
        (answer) => answer.questionId === 5 && answer.option === "1"
      );
      setHasChildren(answeredHasChildren);
      setPhase("financialGoals");
    } catch (err) {
      setPersonalDetailsError(
        err instanceof Error
          ? err.message
          : "Failed to submit personal details. Please try again."
      );
    } finally {
      setIsSubmittingPersonalDetails(false);
    }
  };

  const handleFinancialGoalsSubmit = async (answers: QuestionAnswerDto[]) => {
    setIsSubmittingFinancialGoals(true);
    setFinancialGoalsError(null);

    try {
      await submitFinancialGoals(answers);
      setPhase("budgeting");
    } catch (err) {
      setFinancialGoalsError(
        err instanceof Error
          ? err.message
          : "Failed to submit financial goals. Please try again."
      );
    } finally {
      setIsSubmittingFinancialGoals(false);
    }
  };

  const handleBudgetingSubmit = async (answers: QuestionAnswerDto[]) => {
    setIsSubmittingBudgeting(true);
    setBudgetingError(null);

    try {
      await submitBudgeting(answers);
      setPhase("assetsLiabilities");
    } catch (err) {
      setBudgetingError(
        err instanceof Error
          ? err.message
          : "Failed to submit budgeting information. Please try again."
      );
    } finally {
      setIsSubmittingBudgeting(false);
    }
  };

  const handleAssetsLiabilitiesSubmit = async (payload: AssetsLiabilitiesPayload) => {
    setIsSubmittingAssetsLiabilities(true);
    setAssetsLiabilitiesError(null);

    try {
      await submitAssetsLiabilities(payload);
      setPhase("insurancePlanning");
    } catch (err) {
      setAssetsLiabilitiesError(
        err instanceof Error
          ? err.message
          : "Failed to submit assets and liabilities. Please try again."
      );
    } finally {
      setIsSubmittingAssetsLiabilities(false);
    }
  };

  const handleInsurancePlanningSubmit = async (groups: QuestionAnswerDto[][]) => {
    setIsSubmittingInsurancePlanning(true);
    setInsurancePlanningError(null);

    try {
      await submitInsurancePlanningGroups(groups);
      await loadWealthScore(undefined, true);
    } catch (err) {
      setInsurancePlanningError(
        err instanceof Error
          ? err.message
          : "Failed to submit insurance planning. Please try again."
      );
    } finally {
      setIsSubmittingInsurancePlanning(false);
    }
  };

  const formattedMobile = (() => {
    const digits = mobile.replace(/\D/g, "");
    if (!digits) return "";
    return `🇮🇳 +91 ${digits}`;
  })();

  const isMobileValid = mobile.replace(/\D/g, "").length === 10;
  const isOtpComplete = otpValues.every((v) => v.length === 1);

  return (
    <div className="flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px] px-4 sm:px-0">
        <FinancialPlanForm
          phase={phase}
          mobile={mobile}
          onMobileChange={setMobile}
          otpValues={otpValues}
          onOtpChange={setOtpValues}
          onGoToMobile={goToMobile}
          onMobileSubmit={handleMobileSubmit}
          onVerify={handleVerify}
          onResend={handleResend}
          isMobileValid={isMobileValid}
          isOtpComplete={isOtpComplete}
          isRequesting={isRequesting}
          isVerifying={isVerifying}
          isResending={isResending}
          otpError={otpError}
          formattedMobile={formattedMobile}
          onBackToVerified={() => setPhase("verified")}
          onPersonalDetailsSubmit={handlePersonalDetailsSubmit}
          isSubmittingPersonalDetails={isSubmittingPersonalDetails}
          personalDetailsError={personalDetailsError}
          onContinueFromVerified={() => setPhase("personalDetails")}
          onBackToPersonalDetails={() => setPhase("personalDetails")}
          onFinancialGoalsSubmit={handleFinancialGoalsSubmit}
          isSubmittingFinancialGoals={isSubmittingFinancialGoals}
          financialGoalsError={financialGoalsError}
          hasChildren={hasChildren}
          onBackToFinancialGoals={() => setPhase("financialGoals")}
          onBudgetingSubmit={handleBudgetingSubmit}
          isSubmittingBudgeting={isSubmittingBudgeting}
          budgetingError={budgetingError}
          onBackToBudgeting={() => setPhase("budgeting")}
          onAssetsLiabilitiesSubmit={handleAssetsLiabilitiesSubmit}
          isSubmittingAssetsLiabilities={isSubmittingAssetsLiabilities}
          assetsLiabilitiesError={assetsLiabilitiesError}
          onBackToAssetsLiabilities={() => setPhase("assetsLiabilities")}
          onInsurancePlanningSubmit={handleInsurancePlanningSubmit}
          isSubmittingInsurancePlanning={isSubmittingInsurancePlanning}
          insurancePlanningError={insurancePlanningError}
          wealthScore={wealthScore}
          isLoadingWealthScore={isLoadingWealthScore}
          wealthScoreError={wealthScoreError}
          onRetryWealthScore={() => loadWealthScore(undefined, true)}
          onDownloadPlan={handleDownloadPlan}
          isDownloadingPlan={isDownloadingPlan}
          downloadError={downloadError}
        />
      </div>
    </div>
  );
}
