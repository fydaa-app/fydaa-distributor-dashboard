"use client";

import { getCookie, setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ArnOnboardForm from "./ArnOnboardForm";
import type { RiskProfileQuestion, UserStage } from "@/services/arnOnboardService";
import {
  checkKycRequiresModify,
  isKycReadyToProceed,
  isModifyKycComplete,
  needsKycModify,
} from "@/utils/kycStage";

type Phase = "mobile" | "otp" | "risk" | "riskScore" | "email" | "emailOtp" | "kyc" | "kycCompliant" | "identity" | "bank" | "nominee" | "welcome" | "modifyKyc";

/**
 * Resume onboard phase from getUserStage.
 * Call only after confirming check-kyc is not still action=modify (when risk+email done).
 */
function resolvePhaseFromStage(stage: UserStage): Phase | null {
  if (stage.isRiskProfileComplete && stage.isEmail && needsKycModify(stage)) {
    return "modifyKyc";
  }
  if (
    stage.isRiskProfileComplete &&
    stage.isEmail &&
    isKycReadyToProceed(stage) &&
    stage.isBank &&
    stage.isNominee
  ) {
    return "welcome";
  }
  if (
    stage.isRiskProfileComplete &&
    stage.isEmail &&
    isKycReadyToProceed(stage) &&
    stage.isBank
  ) {
    return "nominee";
  }
  if (
    stage.isRiskProfileComplete &&
    stage.isEmail &&
    isKycReadyToProceed(stage) &&
    !!stage.kycExtraData
  ) {
    return "bank";
  }
  if (stage.isRiskProfileComplete && stage.isEmail && isKycReadyToProceed(stage)) {
    return "kycCompliant";
  }
  if (stage.isRiskProfileComplete && stage.isEmail) {
    return "kyc";
  }
  return null;
}

/**
 * When risk+email are done, block on incomplete modify (stage flags) or check-kyc action=modify
 * (covers the window before POST /kyc/kyc-forms/modify sets ismodify).
 */
async function resolvePhaseWithKycGate(
  stage: UserStage,
  token: string
): Promise<Phase | null> {
  if (stage.isRiskProfileComplete && stage.isEmail) {
    if (needsKycModify(stage)) {
      return "modifyKyc";
    }

    try {
      const { checkKyc } = await import("@/services/arnOnboardService");
      const check = await checkKyc(token);
      if (checkKycRequiresModify(check)) {
        return "modifyKyc";
      }
    } catch {
      // If check-kyc fails, fall through to stage-only routing
    }
  }

  return resolvePhaseFromStage(stage);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function extractOnboardUserId(
  data: Record<string, unknown>,
  token?: string
): string | null {
  const direct = data.userId ?? data.id ?? data.user_id;
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    return String(direct);
  }

  const nestedUser = data.user;
  if (typeof nestedUser === "object" && nestedUser !== null) {
    const nested = (nestedUser as Record<string, unknown>).userId
      ?? (nestedUser as Record<string, unknown>).id
      ?? (nestedUser as Record<string, unknown>).user_id;
    if (nested !== undefined && nested !== null && String(nested).trim() !== "") {
      return String(nested);
    }
  }

  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const fromJwt = payload.userId ?? payload.id ?? payload.user_id ?? payload.sub;
  if (fromJwt !== undefined && fromJwt !== null && String(fromJwt).trim() !== "") {
    return String(fromJwt);
  }

  return null;
}

function extractOnboardUserName(
  data: Record<string, unknown>,
  token?: string
): string {
  const direct = data.name ?? data.fullName ?? data.full_name ?? data.userName;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const firstName = data.firstName ?? data.first_name;
  const lastName = data.lastName ?? data.last_name;
  if (typeof firstName === "string" || typeof lastName === "string") {
    const combined = [firstName, lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .join(" ")
      .trim();
    if (combined) return combined;
  }

  const nestedUser = data.user;
  if (typeof nestedUser === "object" && nestedUser !== null) {
    const nested = extractOnboardUserName(nestedUser as Record<string, unknown>);
    if (nested) return nested;
  }

  if (!token) return "";

  const payload = decodeJwtPayload(token);
  if (!payload) return "";

  const fromJwt = extractOnboardUserName(payload);
  return fromJwt;
}

export default function ArnOnboardPage() {
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
  const [onboardedToken, setOnboardedToken] = useState("");
  const [riskQuestions, setRiskQuestions] = useState<RiskProfileQuestion[]>([]);
  const [riskAnswers, setRiskAnswers] = useState<Record<number, number>>({});
  const [riskIndex, setRiskIndex] = useState(0);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false);
  const [riskScoreData, setRiskScoreData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [isCheckingModifyKyc, setIsCheckingModifyKyc] = useState(false);
  const [modifyKycStatusMessage, setModifyKycStatusMessage] = useState<string | null>(null);

  const router = useRouter();
  const [skipStage, setSkipStage] = useState<UserStage | null>(null);

  const rawUserData = getCookie("userData");
  const userData = rawUserData ? JSON.parse(rawUserData as string) : {};
  const rawEmployeeData = getCookie("employeeData");
  const employeeData = rawEmployeeData ? JSON.parse(rawEmployeeData as string) : {};
  const referredBy = employeeData?.referralCode || userData?.code || "";

  const goToOtp = () => setPhase("otp");
  const goToMobile = () => setPhase("mobile");
  const goToDashboard = () => {
    const raw = getCookie("onboardedUserData");
    const token = getCookie("onboardedUserToken");

    try {
      const data = raw ? JSON.parse(raw as string) : {};
      const userId = extractOnboardUserId(
        data,
        typeof token === "string" ? token : undefined
      );
      const phone =
        mobile.replace(/\D/g, "") ||
        String(data.phone ?? data.mobile ?? data.mobileNumber ?? "").replace(/\D/g, "");

      sessionStorage.setItem(
        "arn_onboard_target_user",
        JSON.stringify({
          userId: userId ?? "",
          name: extractOnboardUserName(
            data,
            typeof token === "string" ? token : undefined
          ),
          phone,
          email: String(data.email ?? ""),
          skipClientStep: true,
        })
      );
    } catch {
      sessionStorage.setItem(
        "arn_onboard_target_user",
        JSON.stringify({
          userId: "",
          name: "",
          phone: mobile.replace(/\D/g, ""),
          email: "",
          skipClientStep: true,
        })
      );
    }

    router.push("/arn-goal-setup");
  };

  const goToKyc = () => {
    setKycError(null);
    setPhase("kyc");
  };

  const goToRiskScore = () => setPhase("riskScore");

  const goToIdentity = () => setPhase("identity");
  const goToKycCompliant = () => setPhase("kycCompliant");
  const goToModifyKyc = () => {
    setModifyKycStatusMessage(null);
    setPhase("modifyKyc");
  };

  const goToEmail = () => setPhase("email");
  const goToEmailOtp = () => setPhase("emailOtp");
  const goToBank = () => setPhase("bank");
  const goToNominee = () => setPhase("nominee");
  const goToWelcome = () => setPhase("welcome");

  const loadRiskScore = async (token: string) => {
    setIsLoadingScore(true);
    setScoreError(null);
    try {
      const indicators = await import("@/services/arnOnboardService").then((m) =>
        m.getRiskIndicators(token)
      );
      setRiskScoreData(indicators);
      setPhase("riskScore");
    } catch (err) {
      setScoreError(
        err instanceof Error ? err.message : "Failed to load risk indicators."
      );
      setPhase("riskScore");
    } finally {
      setIsLoadingScore(false);
    }
  };

  const applyStageResume = async (
    stage: UserStage,
    token: string
  ): Promise<boolean> => {
    const nextPhase = await resolvePhaseWithKycGate(stage, token);
    if (!nextPhase) return false;
    setSkipStage(stage);
    setPhase(nextPhase);
    return true;
  };

  const handleCheckModifyKycStatus = async () => {
    setIsCheckingModifyKyc(true);
    setModifyKycStatusMessage(null);
    try {
      const { getUserStage, checkKyc } = await import(
        "@/services/arnOnboardService"
      );
      const stage = await getUserStage(onboardedToken);
      setSkipStage(stage);

      // Incomplete in-app modify: stay until ismodifynsdl
      if (needsKycModify(stage)) {
        setModifyKycStatusMessage(
          "KYC update is still required. Please complete Modify KYC on the Fydaa mobile app, then check again."
        );
        return;
      }

      const check = await checkKyc(onboardedToken);
      // action=modify blocks even if status/isKycCompliant look ready (pre-form or on-hold)
      if (checkKycRequiresModify(check)) {
        setModifyKycStatusMessage(
          check.message ||
            "KYC update is still required. Please complete Modify KYC on the Fydaa mobile app, then check again."
        );
        return;
      }

      // Only leave this screen when modify is fully done, or KYC is truly ready
      if (!isModifyKycComplete(stage) && !isKycReadyToProceed(stage)) {
        setModifyKycStatusMessage(
          "KYC update is still required. Please complete Modify KYC on the Fydaa mobile app, then check again."
        );
        return;
      }

      const nextPhase = resolvePhaseFromStage(stage);
      if (!nextPhase || nextPhase === "modifyKyc" || nextPhase === "kyc") {
        setModifyKycStatusMessage(
          "KYC update is still required. Please complete Modify KYC on the Fydaa mobile app, then check again."
        );
        return;
      }

      setPhase(nextPhase);
    } catch (err) {
      setModifyKycStatusMessage(
        err instanceof Error
          ? err.message
          : "Failed to check KYC status. Please try again."
      );
    } finally {
      setIsCheckingModifyKyc(false);
    }
  };

  const handleOtpVerified = (token: string) => {
    setOnboardedToken(token);
    setRiskError(null);
    setScoreError(null);
    setModifyKycStatusMessage(null);
    setIsLoadingRisk(true);
    setPhase("risk");

    let effectiveToken = token;

    import("@/services/arnOnboardService")
      .then(({ getUserStage, selectInvestmentModel }) => {
        return selectInvestmentModel("ARN", token)
          .then((modelData) => {
            const newAccessToken =
              typeof modelData?.accessToken === "string" ? modelData.accessToken : null;

            if (newAccessToken) {
              setCookie("onboardedUserToken", newAccessToken, { path: "/" });
              setOnboardedToken(newAccessToken);
              effectiveToken = newAccessToken;
            }
            return getUserStage(effectiveToken);
          })
          .catch(() => getUserStage(effectiveToken));
      })
      .then(async (stage) => {
        if (await applyStageResume(stage, effectiveToken)) {
          return;
        }
        if (stage.isRiskProfileComplete) {
          return loadRiskScore(effectiveToken);
        }
        return import("@/services/arnOnboardService")
          .then(({ getRiskProfileQuestionnaire }) =>
            getRiskProfileQuestionnaire(effectiveToken)
          )
          .then((questions) => {
            setRiskQuestions(questions);
            setRiskIndex(0);
            setRiskAnswers({});
          });
      })
      .catch((err) => {
        setRiskError(
          err instanceof Error
            ? err.message
            : "Failed to load risk profile. Please try again."
        );
      })
      .finally(() => setIsLoadingRisk(false));
  };

  const handleRiskAnswerChange = (questionId: number, optionIndex: number) => {
    setRiskAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleRiskIndexChange = (index: number) => {
    setRiskIndex(index);
    setRiskError(null);
  };

  const handleSubmitRisk = async () => {
    const options = riskQuestions.map((q) => ({
      answerId: (riskAnswers[q.id] ?? 0) + 1,
      questionId: q.id,
      secondaryQuestionId: q.secondaryQuestionId,
    }));

    setIsSubmittingRisk(true);
    setRiskError(null);

    try {
      await import("@/services/arnOnboardService").then((m) =>
        m.createUserRiskProfile(options, onboardedToken)
      );
      await loadRiskScore(onboardedToken);
    } catch (err) {
      setRiskError(
        err instanceof Error ? err.message : "Failed to submit risk profile."
      );
    } finally {
      setIsSubmittingRisk(false);
    }
  };

  return (
    <div className="flex items-center justify-center pt-10 pb-10">
      <div className="w-full max-w-[560px] px-4 sm:px-0">
        <ArnOnboardForm
          phase={phase}
          mobile={mobile}
          onMobileChange={setMobile}
          otpValues={otpValues}
          onOtpChange={setOtpValues}
          onGoToOtp={goToOtp}
          onGoToMobile={goToMobile}
          onReset={goToDashboard}
          onKycVerified={() => setPhase("kycCompliant")}
          onKycModify={goToModifyKyc}
          onCheckModifyKycStatus={handleCheckModifyKycStatus}
          isCheckingModifyKyc={isCheckingModifyKyc}
          modifyKycStatusMessage={modifyKycStatusMessage}
          onGoToIdentity={goToIdentity}
          onGoToKycCompliant={goToKycCompliant}
          onGoToEmail={goToEmail}
          onGoToEmailOtp={goToEmailOtp}
          onEmailVerified={goToKyc}
          onIdentityVerified={() => setPhase("bank")}
          onBankVerified={goToNominee}
          onGoToWelcome={goToWelcome}
          onGoToBank={goToBank}
          onGoToRiskScore={goToRiskScore}
          userStage={skipStage}
          kycError={kycError}
          referredBy={referredBy}
          onOtpVerified={handleOtpVerified}
          riskQuestions={riskQuestions}
          riskAnswers={riskAnswers}
          onRiskAnswerChange={handleRiskAnswerChange}
          riskIndex={riskIndex}
          onRiskIndexChange={handleRiskIndexChange}
          onSubmitRisk={handleSubmitRisk}
          riskError={riskError}
          isLoadingRisk={isLoadingRisk}
          isSubmittingRisk={isSubmittingRisk}
          riskScoreData={riskScoreData}
          isLoadingScore={isLoadingScore}
          scoreError={scoreError}
        />
      </div>
    </div>
  );
}
